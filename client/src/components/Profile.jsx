import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Nav, Badge, Image } from "react-bootstrap";
import { useNavigate,Navigate } from "react-router-dom";
import axios from "axios";
import Post from "./Post";


const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  
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

  // Handle like/unlike functionality
  const handleLike = async (postId) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      console.error('User not authenticated');
      return;
    }

    // Find the current post
    const currentPost = profileData.posts.find(post => post._id === postId);
    if (!currentPost) return;

    const isLiked = currentPost.likes && currentPost.likes.includes(currentUserId);
    
    // Optimistic update - update UI immediately
    setProfileData(prevData => ({
      ...prevData,
      posts: prevData.posts.map(post => {
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
    }));

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
      setProfileData(prevData => ({
        ...prevData,
        posts: prevData.posts.map(post => {
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
                likes: post.likes.filter(id => id !== currentUserId)
              };
            }
          }
          return post;
        })
      }));
    }
  };

  // Handle delete post functionality
  const handleDeletePost = (postId) => {
    // Remove post from UI immediately
    setProfileData(prevData => ({
      ...prevData,
      posts: prevData.posts.filter(post => post._id !== postId)
    }));
  };
  
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setError("You must be logged in to view this page.");
        return;
      }
      try {
        const response = await axios.get("http://localhost:5000/profile", {
          headers: {
            Authorization: "Bearer " + token,
          },
          withCredentials: true
        });
        setProfileData(response.data);
      } catch (error) {
        console.error("Profile fetch error:", error);
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

 const handleLogout = async () => {
   try {
     await axios.post("http://localhost:5000/logout", {}, {
       headers: {
         Authorization: "Bearer " + localStorage.getItem('token'),
       },
       withCredentials: true
     });
     localStorage.removeItem("token");
     navigate("/login");
   } catch (error) {
     console.error("Logout error:", error);
     // localStorage.removeItem("token");
     // navigate("/login");
   }
 };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-gray-500 text-align-center">Loading profile...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-red-500">{error}</p></div>;
  if (!profileData) return <Navigate to="/login" />;

  const user = profileData.user || {};
  const posts = profileData.posts || [];
  
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Header */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px 0",
        marginBottom: "30px"
      }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="text-white mb-0 fw-bold">Profile</h2>
            <div>
              <Button 
                variant="outline-light" 
                className="me-2"
                style={{ borderRadius: "20px" }}
                onClick={() => navigate('/home')}
              >
               Home
              </Button>
              <Button 
                variant="outline-light"
                onClick={handleLogout}
                style={{ borderRadius: "20px" }}
              >
                Logout
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        {/* Profile Info Card */}
        <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: "15px" }}>
          <Card.Body className="p-4">
            <Row>
              <Col md={3} className="text-center text-md-start">
                <div className="position-relative d-inline-block">
                  <Image
                    src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=avatar"}
                    roundedCircle
                    style={{ 
                      width: "150px", 
                      height: "150px",
                      border: "4px solid #667eea",
                      objectFit: "cover"
                    }}
                    alt="Profile Avatar"
                  />
                  {/* {user.verified && (
                    <Badge 
                      bg="primary" 
                      className="position-absolute"
                      style={{ 
                        bottom: "10px", 
                        right: "10px",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      ✓
                    </Badge>
                  )} */}
                </div>
              </Col>
              <Col md={9}>
                <div className="mt-3 mt-md-0">
                  <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3">
                    <div>
                      <h3 className="mb-0 fw-bold">{user.username}</h3>
                      <p className="text-muted mb-2">{user.email}</p>
                    </div>
                    <div>
                      <Button 
                        style={{ 
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                          borderRadius: "20px",
                          padding: "8px 30px"
                        }}
                        className="me-2"
                        onClick={() => {
                      if(window.confirm('Are you sure you want to edit your profile?')) {
                       navigate('/profile/edit')
                      }
                    }}
                      >
                        Edit Profile
                      </Button>
                      {/* <Button 
                        variant="outline-secondary"
                        style={{ borderRadius: "20px", padding: "8px 30px" }}
                      >
                        Share
                      </Button> */}
                    </div>
                  </div>
                  
               
                  
                  <Row className="text-center text-md-start">
                    <Col xs={4} md={2}>
                      <h5 className="fw-bold mb-0" style={{ color: "#667eea" }}>{posts.length}</h5>
                      <small className="text-muted">Posts</small>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Tabs */}
        <Nav variant="tabs" className="mb-4" style={{ borderBottom: "2px solid #dee2e6" }}>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
              style={{ 
                color: activeTab === "posts" ? "#667eea" : "#6c757d",
                borderBottom: activeTab === "posts" ? "2px solid #667eea" : "none",
                fontWeight: activeTab === "posts" ? "600" : "normal"
              }}
            >
              📷 Posts
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {
          posts.length > 0 ? (
            <Row className="g-3 mb-5">
              {posts.map((post) => (
                <Post key={post._id} post={post} onLike={handleLike} onDelete={handleDeletePost}/>
              ))}
            </Row>
          ) : (
            <div className="text-center my-5 ">
            <p className="text-center  text-muted">You haven't made any posts yet.</p>
            <Button 
                        style={{ 
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                          borderRadius: "20px",
                          padding: "8px 30px"
                        }}
                        className="d-block mx-auto mt-4"
                        onClick={() => navigate('/createPost')}
                      >
                        Create New Post
                      </Button>
                      </div>
          )
        }
      </Container>
    </div>
  );
};

export default Profile;