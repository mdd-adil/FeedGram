import { useEffect, useState } from "react";
import { Container, Card, Button, Row, Col, Image, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import FeedPost from "./FeedPost";

const Home = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Helper function to get current user ID from token
  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  // Fetch posts from backend
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/home', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setPosts(data.posts || data); // Handle both paginated and simple response
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch current user data
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCurrentUser(data.user);
    } catch (err) {
      console.log(err);
    }
  };

  // Generate avatar from username if no avatar available
  const getCurrentUserAvatar = () => {
    if (currentUser?.avatar) {
      return currentUser.avatar;
    }
    const username = currentUser?.username || 'User';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
  };

  // Handle like/unlike functionality
  const handleLike = async (postId) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      console.error('User not authenticated');
      return;
    }

    // Find the current post
    const currentPost = posts.find(post => post._id === postId);
    if (!currentPost) return;

    const isLiked = currentPost.likes && currentPost.likes.includes(currentUserId);
    
    // Optimistic update - update UI immediately
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post._id === postId) {
          if (isLiked) {
            // Unlike
            return {
              ...post,
              likes: post.likes.filter(id => id !== currentUserId)
            };
          } else {
            // Like
            return {
              ...post,
              likes: [...post.likes, currentUserId]
            };
          }
        }
        return post;
      })
    );

    try {
      // Make API call
      const endpoint = isLiked ? `unlike/${postId}` : `like/${postId}`;
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

    } catch (error) {
      console.error('Like/Unlike error:', error);
      
      // Revert optimistic update on error
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post._id === postId) {
            if (isLiked) {
              // Revert unlike
              return {
                ...post,
                likes: [...post.likes, currentUserId]
              };
            } else {
              // Revert like
              return {
                ...post,
                likes: post.likes.indexOf(id => id !== currentUserId)
              };
            }
          }
          return post;
        })
      );
    }
  };

  // Handle delete post functionality
  const handleDeletePost = (postId) => {
    // Remove post from UI immediately
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  useEffect(() => {
    fetchPosts();
    fetchCurrentUser();
  }, []);

  const handleProfileClick = () => {
    if(!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    navigate("/profile");
  };

  const handleLogout = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "15px 0",
        marginBottom: "30px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="text-white mb-0 fw-bold d-flex align-items-center">
              <span style={{ fontSize: "30px", marginRight: "10px" }}>🌟</span>
              Social Feed
            </h2>
            <div className="d-flex align-items-center">
              <Image
                src={getCurrentUserAvatar()}
                roundedCircle
                onClick={handleProfileClick}
                style={{ 
                  width: "40px", 
                  height: "40px",
                  marginRight: "15px",
                  cursor: "pointer",
                  border: "2px solid white",
                  objectFit: "cover"
                }}
                alt="User Avatar"
              />
              <Button 
                variant="outline-light"
                onClick={() => navigate('/chat')}
                style={{ borderRadius: "20px",
                  background:"linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  marginRight: "15px"
                }}
              >
                Chat �
              </Button>

              <Button 
                variant="outline-light"
                onClick={handleLogout}
                style={{ borderRadius: "20px",
                  background:"linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <Row className="justify-content-center">
          <Col lg={7}>
            {/* Create Post Card */}
            <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: "15px" }}>
              <Card.Body className="p-4">
                <div className="d-flex align-items-center">
                  <Image
                    src={getCurrentUserAvatar()}
                    roundedCircle
                    style={{ 
                      width: "50px", 
                      height: "50px", 
                      marginRight: "15px",
                      border: "3px solid #667eea",
                      objectFit: "cover"
                    }}
                    alt="User Avatar"
                  />
                  <Form.Control
                    type="text"
                    placeholder="What's on your mind?"
                    disabled
                    style={{ 
                      borderRadius: "25px",
                      padding: "10px 20px",
                      backgroundColor: "#f0f2f5",
                      border: "1px solid #ddd",
                      color: "#65676b"
                    }}
                  />
                  <Button
                    style={{ 
                      marginLeft: "10px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      border: "none",
                      padding: "10px 20px"
                    }}
                    onClick={() => navigate('/createPost')}
                  >
                    Create New Post
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Posts Feed */}
            {posts.length > 0 && posts.map((post) => (
              <FeedPost 
                key={post._id} 
                post={post} 
                onLike={handleLike}
                onDelete={handleDeletePost}
              />
            ))}

            {/* Load More */}
            <div className="text-center mb-5">
              <Button
                size="lg"
                style={{ 
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: "25px",
                  padding: "12px 40px",
                  fontWeight: "600"
                }}
              >
                Load More Posts
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Home;