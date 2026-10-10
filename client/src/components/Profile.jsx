import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Nav, Image, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import Post from "./Post";
import { API_BASE_URL } from "../config/api";
import { removeToken } from "../utils/auth";

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [isUnfollowing, setIsUnfollowing] = useState(null);

  const getCurrentUserId = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Like / Unlike optimistic updater
  const handleLike = async (postId) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId || !profileData) return;

    const currentPost = profileData.posts.find((p) => p._id === postId);
    if (!currentPost) return;

    const isLiked = currentPost.likes && currentPost.likes.includes(currentUserId);

    setProfileData((prevData) => ({
      ...prevData,
      posts: prevData.posts.map((post) => {
        if (post._id === postId) {
          const likes = Array.isArray(post.likes) ? post.likes : [];
          return {
            ...post,
            likes: isLiked
              ? likes.filter((id) => id !== currentUserId)
              : [...likes, currentUserId],
          };
        }
        return post;
      }),
    }));

    try {
      const endpoint = isLiked ? `unlike/${postId}` : `like/${postId}`;
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to update like");
    } catch (err) {
      console.error("Like error:", err);
      // Revert optimistic update
      setProfileData((prevData) => ({
        ...prevData,
        posts: prevData.posts.map((post) => {
          if (post._id === postId) {
            const likes = Array.isArray(post.likes) ? post.likes : [];
            return {
              ...post,
              likes: isLiked
                ? [...likes, currentUserId]
                : likes.filter((id) => id !== currentUserId),
            };
          }
          return post;
        }),
      }));
    }
  };

  const handleDeletePost = (postId) => {
    setProfileData((prevData) => ({
      ...prevData,
      posts: prevData.posts.filter((post) => post._id !== postId),
    }));
  };

  const togglePrivacy = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_BASE_URL}/follow/privacy/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProfileData((prevData) => ({
        ...prevData,
        user: {
          ...prevData.user,
          isPrivate: response.data.isPrivate,
        },
      }));

      showToast(response.data.message || "Privacy updated");
    } catch (err) {
      console.error("Toggle privacy error:", err);
      showToast("Failed to update privacy setting");
    }
  };

  const fetchFollowers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = getCurrentUserId();
      if (!userId) return;
      const res = await axios.get(`${API_BASE_URL}/follow/followers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowers(res.data.followers || []);
    } catch (err) {
      console.error("Fetch followers error:", err);
    }
  }, [getCurrentUserId]);

  const fetchFollowing = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = getCurrentUserId();
      if (!userId) return;
      const res = await axios.get(`${API_BASE_URL}/follow/following/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowing(res.data.following || []);
    } catch (err) {
      console.error("Fetch following error:", err);
    }
  }, [getCurrentUserId]);

  const fetchFollowRequests = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/follow/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFollowRequests(res.data.requests || []);
    } catch (err) {
      console.error("Fetch follow requests error:", err);
    }
  }, []);

  const acceptFollowRequest = async (requesterId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/follow/accept/${requesterId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setFollowRequests((prev) => prev.filter((req) => req._id !== requesterId));
      fetchFollowers();

      setProfileData((prevData) => ({
        ...prevData,
        user: {
          ...prevData.user,
          followersCount: (prevData.user.followersCount || 0) + 1,
          pendingRequestsCount: Math.max(0, (prevData.user.pendingRequestsCount || 1) - 1),
        },
      }));

      showToast("Follow request accepted");
    } catch (err) {
      console.error("Accept error:", err);
      showToast("Failed to accept follow request");
    }
  };

  const rejectFollowRequest = async (requesterId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/follow/reject/${requesterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFollowRequests((prev) => prev.filter((req) => req._id !== requesterId));
      setProfileData((prevData) => ({
        ...prevData,
        user: {
          ...prevData.user,
          pendingRequestsCount: Math.max(0, (prevData.user.pendingRequestsCount || 1) - 1),
        },
      }));

      showToast("Follow request rejected");
    } catch (err) {
      console.error("Reject error:", err);
      showToast("Failed to reject follow request");
    }
  };

  const unfollowUser = async (userId) => {
    if (isUnfollowing === userId) return;

    try {
      setIsUnfollowing(userId);
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/follow/unfollow/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFollowing((prev) => prev.filter((u) => u._id !== userId));
      setProfileData((prevData) => ({
        ...prevData,
        user: {
          ...prevData.user,
          followingCount: Math.max(0, (prevData.user.followingCount || 0) - 1),
        },
      }));

      showToast("Unfollowed successfully");
    } catch (err) {
      console.error("Unfollow error:", err);
      showToast("Failed to unfollow user");
    } finally {
      setIsUnfollowing(null);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setError("Please login to view profile");
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setProfileData(response.data);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (profileData) {
      if (activeTab === "followers") {
        fetchFollowers();
      } else if (activeTab === "following") {
        fetchFollowing();
      } else if (activeTab === "requests") {
        fetchFollowRequests();
      }
    }
  }, [activeTab, profileData, fetchFollowers, fetchFollowing, fetchFollowRequests]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(
          `${API_BASE_URL}/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
      }
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      removeToken();
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="app-container d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="dark" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container d-flex flex-column align-items-center justify-content-center">
        <p className="text-danger mb-3">{error}</p>
        <button
          className="btn-minimal btn-minimal-primary"
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (!profileData) return <Navigate to="/login" />;

  const user = profileData.user || {};
  const posts = profileData.posts || [];

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {showNotification && (
        <Alert
          variant="dark"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-dropdown)",
            fontSize: "0.875rem",
          }}
          dismissible
          onClose={() => setShowNotification(false)}
        >
          {notification}
        </Alert>
      )}

      {/* Minimalist Header */}
      <header className="navbar-minimal">
        <Container className="d-flex align-items-center justify-content-between">
          <div
            className="brand-title cursor-pointer"
            onClick={() => navigate("/home")}
          >
            <span className="brand-dot"></span>
            <span>FeedGram</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn-minimal btn-minimal-secondary btn-minimal-sm"
              onClick={() => navigate("/home")}
            >
              ← Feed
            </button>
            <button
              className="btn-minimal btn-minimal-secondary btn-minimal-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </Container>
      </header>

      {/* Main Profile Layout */}
      <main className="container py-4" style={{ maxWidth: "860px" }}>
        {/* Profile Card */}
        <section className="profile-card">
          <Row className="align-items-center">
            <Col xs={12} sm={3} className="text-center mb-3 mb-sm-0">
              <Image
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    user.username || "User"
                  )}`
                }
                roundedCircle
                className="profile-avatar-large"
                alt={user.username}
              />
            </Col>

            <Col xs={12} sm={9}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h2
                    style={{
                      fontSize: "1.35rem",
                      fontWeight: 700,
                      margin: 0,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {user.username}
                  </h2>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    {user.email}
                  </p>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                    onClick={() => navigate("/profile/edit")}
                  >
                    Edit Profile
                  </button>
                  <button
                    className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                    onClick={togglePrivacy}
                  >
                    {user.isPrivate ? "🔒 Private" : "🌐 Public"}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div
                className="d-flex gap-4 py-2"
                style={{
                  borderTop: "1px solid var(--border-subtle)",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div className="profile-stat-box p-0 text-start">
                  <div className="profile-stat-num">{posts.length}</div>
                  <div className="profile-stat-label">Posts</div>
                </div>
                <div className="profile-stat-box p-0 text-start">
                  <div className="profile-stat-num">{user.followersCount || 0}</div>
                  <div className="profile-stat-label">Followers</div>
                </div>
                <div className="profile-stat-box p-0 text-start">
                  <div className="profile-stat-num">{user.followingCount || 0}</div>
                  <div className="profile-stat-label">Following</div>
                </div>
              </div>
            </Col>
          </Row>
        </section>

        {/* Minimalist Tabs */}
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link
              active={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
            >
              Posts ({posts.length})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "followers"}
              onClick={() => setActiveTab("followers")}
            >
              Followers ({user.followersCount || 0})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "following"}
              onClick={() => setActiveTab("following")}
            >
              Following ({user.followingCount || 0})
            </Nav.Link>
          </Nav.Item>
          {user.pendingRequestsCount > 0 && (
            <Nav.Item>
              <Nav.Link
                active={activeTab === "requests"}
                onClick={() => setActiveTab("requests")}
              >
                Requests ({user.pendingRequestsCount})
              </Nav.Link>
            </Nav.Item>
          )}
        </Nav>

        {/* Tab Content */}
        {activeTab === "posts" && (
          posts.length > 0 ? (
            <Row className="g-3">
              {posts.map((post) => (
                <Post
                  key={post._id}
                  post={post}
                  onLike={handleLike}
                  onDelete={handleDeletePost}
                />
              ))}
            </Row>
          ) : (
            <div className="text-center py-5">
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                You have not shared any posts yet.
              </p>
              <button
                className="btn-minimal btn-minimal-primary"
                onClick={() => navigate("/createPost")}
              >
                Create a Post
              </button>
            </div>
          )
        )}

        {activeTab === "followers" && (
          <Row className="g-3">
            {followers.length > 0 ? (
              followers.map((f) => (
                <Col key={f._id} md={6}>
                  <div className="minimal-card p-3 d-flex align-items-center justify-content-between mb-0">
                    <div
                      className="d-flex align-items-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/user/${f._id}`)}
                    >
                      <Image
                        src={
                          f.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            f.username
                          )}`
                        }
                        roundedCircle
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                          border: "1px solid var(--border-subtle)",
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {f.username}
                        </div>
                        <small style={{ color: "var(--text-muted)" }}>Follower</small>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                        onClick={() => navigate(`/user/${f._id}`)}
                      >
                        Profile
                      </button>
                      <button
                        className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                        onClick={() => navigate(`/chat?userId=${f._id}`)}
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center py-5">
                <p style={{ color: "var(--text-muted)" }}>No followers yet</p>
              </Col>
            )}
          </Row>
        )}

        {activeTab === "following" && (
          <Row className="g-3">
            {following.length > 0 ? (
              following.map((u) => (
                <Col key={u._id} md={6}>
                  <div className="minimal-card p-3 d-flex align-items-center justify-content-between mb-0">
                    <div
                      className="d-flex align-items-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/user/${u._id}`)}
                    >
                      <Image
                        src={
                          u.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            u.username
                          )}`
                        }
                        roundedCircle
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                          border: "1px solid var(--border-subtle)",
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {u.username}
                        </div>
                        <small style={{ color: "var(--text-muted)" }}>Following</small>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn-minimal btn-minimal-danger btn-minimal-sm"
                        onClick={() => unfollowUser(u._id)}
                        disabled={isUnfollowing === u._id}
                      >
                        {isUnfollowing === u._id ? "..." : "Unfollow"}
                      </button>
                      <button
                        className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                        onClick={() => navigate(`/chat?userId=${u._id}`)}
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center py-5">
                <p style={{ color: "var(--text-muted)" }}>Not following anyone yet</p>
              </Col>
            )}
          </Row>
        )}

        {activeTab === "requests" && (
          <Row className="g-3">
            {followRequests.length > 0 ? (
              followRequests.map((req) => (
                <Col key={req._id} md={6}>
                  <div className="minimal-card p-3 d-flex align-items-center justify-content-between mb-0">
                    <div
                      className="d-flex align-items-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/user/${req._id}`)}
                    >
                      <Image
                        src={
                          req.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                            req.username
                          )}`
                        }
                        roundedCircle
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                          border: "1px solid var(--border-subtle)",
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {req.username}
                        </div>
                        <small style={{ color: "var(--text-muted)" }}>Wants to follow</small>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn-minimal btn-minimal-primary btn-minimal-sm"
                        onClick={() => acceptFollowRequest(req._id)}
                      >
                        Accept
                      </button>
                      <button
                        className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                        onClick={() => rejectFollowRequest(req._id)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </Col>
              ))
            ) : (
              <Col xs={12} className="text-center py-5">
                <p style={{ color: "var(--text-muted)" }}>No pending follow requests</p>
              </Col>
            )}
          </Row>
        )}
      </main>
    </div>
  );
};

export default Profile;