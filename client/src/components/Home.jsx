import { useEffect, useState, useCallback, useRef } from "react";
import { Container, Card, Image, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import FeedPost from "./FeedPost";
import { API_BASE_URL } from "../config/api";

const POSTS_CACHE_KEY = "home_posts_cache";
const USER_CACHE_KEY = "home_user_cache";

const Home = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cachedUser = sessionStorage.getItem(USER_CACHE_KEY);
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch (error) {
      return null;
    }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Helper to extract current user ID from JWT
  const getCurrentUserId = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId;
      } catch (error) {
        return null;
      }
    }
    return null;
  }, []);

  const currentUserId = getCurrentUserId();

  const cachePosts = (nextPosts) => {
    try {
      sessionStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(nextPosts));
    } catch (error) {
      console.error("Cache posts error:", error);
    }
  };

  const cacheCurrentUser = (nextUser) => {
    try {
      if (nextUser) {
        sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(nextUser));
      }
    } catch (error) {
      console.error("Cache user error:", error);
    }
  };

  // Fetch posts from backend
  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/home`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      const nextPosts = data.posts || data;
      setPosts(nextPosts);
      cachePosts(nextPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  }, []);

  // Fetch current user data
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      setCurrentUser(data.user);
      cacheCurrentUser(data.user);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  }, []);

  // Debounced search for users
  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/search/users?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 250);
  };

  const handleSearchResultClick = (userId) => {
    navigate(`/user/${userId}`);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // Generate avatar from username
  const getCurrentUserAvatar = () => {
    if (currentUser?.avatar) {
      return currentUser.avatar;
    }
    const username = currentUser?.username || "User";
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
  };

  // Optimistic like handler with proper rollback
  const handleLike = async (postId) => {
    const userId = currentUserId;
    if (!userId) {
      navigate("/login");
      return;
    }

    const currentPost = posts.find((p) => p._id === postId);
    if (!currentPost) return;

    const isLiked = currentPost.likes && currentPost.likes.includes(userId);

    // Optimistic state update
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id === postId) {
          const postLikes = Array.isArray(post.likes) ? post.likes : [];
          return {
            ...post,
            likes: isLiked
              ? postLikes.filter((id) => id !== userId)
              : [...postLikes, userId],
          };
        }
        return post;
      })
    );

    try {
      const endpoint = isLiked ? `unlike/${postId}` : `like/${postId}`;
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update like status");
      }
    } catch (error) {
      console.error("Like/Unlike error:", error);
      // Revert optimistic update accurately
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const postLikes = Array.isArray(post.likes) ? post.likes : [];
            return {
              ...post,
              likes: isLiked
                ? [...postLikes, userId]
                : postLikes.filter((id) => id !== userId),
            };
          }
          return post;
        })
      );
    }
  };

  // Immediate UI update on delete
  const handleDeletePost = (postId) => {
    setPosts((prevPosts) => {
      const nextPosts = prevPosts.filter((post) => post._id !== postId);
      cachePosts(nextPosts);
      return nextPosts;
    });
  };

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(POSTS_CACHE_KEY);
      if (cached) {
        setPosts(JSON.parse(cached));
      } else {
        fetchPosts();
      }
    } catch {
      fetchPosts();
    }

    if (!currentUser) {
      fetchCurrentUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close search results dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-wrapper")) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiration");
    sessionStorage.removeItem(POSTS_CACHE_KEY);
    sessionStorage.removeItem(USER_CACHE_KEY);
    navigate("/login");
  };

  return (
    <div className="app-container">
      {/* Minimalist Top Navigation */}
      <header className="navbar-minimal">
        <Container className="d-flex align-items-center justify-content-between">
          {/* Brand */}
          <div
            className="brand-title cursor-pointer"
            onClick={() => navigate("/home")}
          >
            <span className="brand-dot"></span>
            <span>FeedGram</span>
          </div>

          {/* Search Bar */}
          <div className="search-wrapper mx-3">
            <span className="search-icon-minimal">🔍</span>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input-minimal"
            />

            {/* Search Dropdown */}
            {showSearchResults && (
              <div className="search-dropdown-minimal">
                {searchLoading ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="dark" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => handleSearchResultClick(user._id)}
                      className="search-item-minimal"
                    >
                      <Image
                        src={
                          user.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            user.username
                          )}`
                        }
                        roundedCircle
                        style={{
                          width: "32px",
                          height: "32px",
                          objectFit: "cover",
                          marginRight: "10px",
                          border: "1px solid var(--border-subtle)",
                        }}
                      />
                      <div className="flex-grow-1">
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {user.username}
                        </div>
                        {user.isPrivate && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            🔒 Private
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  searchQuery.trim() && (
                    <div
                      className="text-center py-3"
                      style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                    >
                      No users found
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* User Nav Actions */}
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn-minimal btn-minimal-secondary btn-minimal-sm"
              onClick={() => navigate("/chat")}
              title="Messages"
            >
              <span>💬</span>
              <span className="d-none d-sm-inline">Chat</span>
            </button>

            <button
              className="btn-minimal btn-minimal-secondary btn-minimal-sm"
              onClick={() => navigate("/profile")}
              title="Profile"
            >
              <Image
                src={getCurrentUserAvatar()}
                roundedCircle
                style={{
                  width: "22px",
                  height: "22px",
                  objectFit: "cover",
                }}
                alt="Profile"
              />
              <span className="d-none d-sm-inline">Profile</span>
            </button>

            <button
              className="btn-minimal btn-minimal-secondary btn-minimal-sm"
              onClick={handleLogout}
              title="Logout"
            >
              Logout
            </button>
          </div>
        </Container>
      </header>

      {/* Main Content Feed */}
      <main className="feed-container">
        {/* Quick Post Prompt */}
        <div className="create-post-trigger">
          <Image
            src={getCurrentUserAvatar()}
            roundedCircle
            style={{
              width: "42px",
              height: "42px",
              objectFit: "cover",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
            }}
            onClick={() => navigate("/profile")}
            alt="You"
          />
          <div
            className="create-post-fake-input"
            onClick={() => navigate("/createPost")}
          >
            Share an update or photo...
          </div>
          <button
            className="btn-minimal btn-minimal-primary btn-minimal-sm"
            onClick={() => navigate("/createPost")}
          >
            + Post
          </button>
        </div>

        {/* Post Feed */}
        {posts.length > 0 ? (
          posts.map((post) => (
            <FeedPost
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              onLike={handleLike}
              onDelete={handleDeletePost}
            />
          ))
        ) : (
          <Card className="text-center py-5 border-0 bg-transparent">
            <Card.Body>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.95rem",
                  marginBottom: "1rem",
                }}
              >
                No posts to display in your feed yet.
              </p>
              <button
                className="btn-minimal btn-minimal-primary"
                onClick={() => navigate("/createPost")}
              >
                Create the First Post
              </button>
            </Card.Body>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Home;
