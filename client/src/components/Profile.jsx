import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Nav, Image, Alert } from "react-bootstrap";
import { useNavigate,Navigate } from "react-router-dom";
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
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [isUnfollowing, setIsUnfollowing] = useState(null); // Track which user is being unfollowed
  
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
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
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

  // Toggle account privacy
  const togglePrivacy = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${API_BASE_URL}/follow/privacy/toggle`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update the profile data
      setProfileData(prevData => ({
        ...prevData,
        user: {
          ...prevData.user,
          isPrivate: response.data.isPrivate
        }
      }));
      
      // Show notification instead of alert
      setNotification(response.data.message);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    } catch (error) {
      console.error('Toggle privacy error:', error);
      setNotification('Failed to update privacy setting');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
    }
  };

  // Fetch followers
  const fetchFollowers = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = getCurrentUserId();
      const response = await axios.get(`${API_BASE_URL}/follow/followers/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFollowers(response.data.followers);
    } catch (error) {
      console.error('Fetch followers error:', error);
    }
  };

  // Fetch following
  const fetchFollowing = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = getCurrentUserId();
      const response = await axios.get(`${API_BASE_URL}/follow/following/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFollowing(response.data.following);
    } catch (error) {
      console.error('Fetch following error:', error);
    }
  };

  // Fetch follow requests
  const fetchFollowRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/follow/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFollowRequests(response.data.requests);
    } catch (error) {
      console.error('Fetch follow requests error:', error);
    }
  };

  // Accept follow request
  const acceptFollowRequest = async (requesterId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/follow/accept/${requesterId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Remove from requests and refresh data
      setFollowRequests(prev => prev.filter(req => req._id !== requesterId));
      fetchFollowers();
      
      // Update profile data
      setProfileData(prevData => ({
        ...prevData,
        user: {
          ...prevData.user,
          followersCount: (prevData.user.followersCount || 0) + 1,
          pendingRequestsCount: (prevData.user.pendingRequestsCount || 1) - 1
        }
      }));

      // Show success notification
      setNotification('Follow request accepted');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('Accept follow request error:', error);
      setNotification('Failed to accept follow request');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  // Reject follow request
  const rejectFollowRequest = async (requesterId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/follow/reject/${requesterId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Remove from requests
      setFollowRequests(prev => prev.filter(req => req._id !== requesterId));
      
      // Update profile data
      setProfileData(prevData => ({
        ...prevData,
        user: {
          ...prevData.user,
          pendingRequestsCount: (prevData.user.pendingRequestsCount || 1) - 1
        }
      }));

      // Show success notification
      setNotification('Follow request rejected');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('Reject follow request error:', error);
      setNotification('Failed to reject follow request');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  // Unfollow user
  const unfollowUser = async (userId) => {
    if (isUnfollowing === userId) return; // Prevent multiple clicks
    
    try {
      setIsUnfollowing(userId); // Set loading state for this specific user
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/follow/unfollow/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Remove from following list
      setFollowing(prev => prev.filter(user => user._id !== userId));
      
      // Update profile data
      setProfileData(prevData => ({
        ...prevData,
        user: {
          ...prevData.user,
          followingCount: (prevData.user.followingCount || 0) - 1
        }
      }));

      // Show success notification
      setNotification('Successfully unfollowed user');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      console.error('Unfollow error:', error);
      setNotification('Failed to unfollow user');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setIsUnfollowing(null); // Clear loading state
    }
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
        const response = await axios.get(`${API_BASE_URL}/profile`, {
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

  // Fetch data based on active tab
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
  }, [activeTab, profileData]);

 const handleLogout = async () => {
   try {
     await axios.post(`${API_BASE_URL}/logout`, {}, {
       headers: {
         Authorization: "Bearer " + localStorage.getItem('token'),
       },
       withCredentials: true
     });
     removeToken(); // Remove token and expiration
     navigate("/login");
   } catch (error) {
     console.error("Logout error:", error);
     removeToken(); // Still remove token even if logout API fails
     navigate("/login");
   }
 };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-gray-500 text-align-center">Loading profile...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p className="text-red-500">{error}</p></div>;
  if (!profileData) return <Navigate to="/login" />;

  const user = profileData.user || {};
  const posts = profileData.posts || [];
  
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Notification Alert */}
      {showNotification && (
        <Alert 
          variant={notification.includes('successfully') || notification.includes('now') ? 'success' : 'danger'}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            minWidth: '300px'
          }}
          dismissible
          onClose={() => setShowNotification(false)}
        >
          {notification}
        </Alert>
      )}

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
                      
                       navigate('/profile/edit')
                      }
                    }
                      >
                        Edit Profile
                      </Button>
                      <Button 
                        variant={!user.isPrivate ? "warning" : "success"}
                        style={{ borderRadius: "20px", padding: "8px 20px" }}
                        className="me-2"
                        onClick={togglePrivacy}
                      >
                        {!user.isPrivate ? '🔒 Private' : '🌍 Public'}
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
                    <Col xs={4} md={2}>
                      <h5 className="fw-bold mb-0" style={{ color: "#667eea" }}>{user.followersCount || 0}</h5>
                      <small className="text-muted">Followers</small>
                    </Col>
                    <Col xs={4} md={2}>
                      <h5 className="fw-bold mb-0" style={{ color: "#667eea" }}>{user.followingCount || 0}</h5>
                      <small className="text-muted">Following</small>
                    </Col>
                  </Row>
                  
                  {/* Privacy Status */}
                  <div className="mt-3">
                    <span className={`badge ${user.isPrivate ? 'bg-warning' : 'bg-success'}`}>
                      {user.isPrivate ? '🔒 Private Account' : '🌍 Public Account'}
                    </span>
                    {user.pendingRequestsCount > 0 && (
                      <span className="badge bg-info ms-2">
                        {user.pendingRequestsCount} Follow Request{user.pendingRequestsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
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
          <Nav.Item>
            <Nav.Link 
              active={activeTab === "followers"}
              onClick={() => setActiveTab("followers")}
              style={{ 
                color: activeTab === "followers" ? "#667eea" : "#6c757d",
                borderBottom: activeTab === "followers" ? "2px solid #667eea" : "none",
                fontWeight: activeTab === "followers" ? "600" : "normal"
              }}
            >
              👥 Followers ({user.followersCount || 0})
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === "following"}
              onClick={() => setActiveTab("following")}
              style={{ 
                color: activeTab === "following" ? "#667eea" : "#6c757d",
                borderBottom: activeTab === "following" ? "2px solid #667eea" : "none",
                fontWeight: activeTab === "following" ? "600" : "normal"
              }}
            >
              ➡️ Following ({user.followingCount || 0})
            </Nav.Link>
          </Nav.Item>
          {user.pendingRequestsCount > 0 && (
            <Nav.Item>
              <Nav.Link 
                active={activeTab === "requests"}
                onClick={() => setActiveTab("requests")}
                style={{ 
                  color: activeTab === "requests" ? "#667eea" : "#6c757d",
                  borderBottom: activeTab === "requests" ? "2px solid #667eea" : "none",
                  fontWeight: activeTab === "requests" ? "600" : "normal"
                }}
              >
                🔔 Requests ({user.pendingRequestsCount})
              </Nav.Link>
            </Nav.Item>
          )}
        </Nav>

        {/* Tab Content */}
        {activeTab === "posts" && (
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
        )}

        {activeTab === "followers" && (
          <Row className="g-3 mb-5">
            {followers.length > 0 ? (
              followers.map((follower) => (
                <Col key={follower._id} md={6} lg={4}>
                  <Card className="h-100 shadow-sm border-0" style={{ borderRadius: "15px" }}>
                    <Card.Body className="d-flex align-items-center p-3">
                      <Image
                        src={follower.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=avatar"}
                        roundedCircle
                        style={{ width: "50px", height: "50px", objectFit: "cover", cursor: "pointer" }}
                        className="me-3"
                        onClick={() => navigate(`/user/${follower._id}`)}
                      />
                      <div className="flex-grow-1">
                        <h6 
                          className="mb-0" 
                          style={{ cursor: "pointer", color: "#667eea" }}
                          onClick={() => navigate(`/user/${follower._id}`)}
                        >
                          {follower.username}
                        </h6>
                        <small className="text-muted">Follower</small>
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => navigate(`/user/${follower._id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => navigate(`/chat?userId=${follower._id}`)}
                        >
                          Message
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <div className="text-center my-5">
                <p className="text-muted">No followers yet</p>
              </div>
            )}
          </Row>
        )}

        {activeTab === "following" && (
          <Row className="g-3 mb-5">
            {following.length > 0 ? (
              following.map((followingUser) => (
                <Col key={followingUser._id} md={6} lg={4}>
                  <Card className="h-100 shadow-sm border-0" style={{ borderRadius: "15px" }}>
                    <Card.Body className="d-flex align-items-center p-3">
                      <Image
                        src={followingUser.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=avatar"}
                        roundedCircle
                        style={{ width: "50px", height: "50px", objectFit: "cover", cursor: "pointer" }}
                        className="me-3"
                        onClick={() => navigate(`/user/${followingUser._id}`)}
                      />
                      <div className="flex-grow-1">
                        <h6 
                          className="mb-0" 
                          style={{ cursor: "pointer", color: "#667eea" }}
                          onClick={() => navigate(`/user/${followingUser._id}`)}
                        >
                          {followingUser.username}
                        </h6>
                        <small className="text-muted">Following</small>
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => unfollowUser(followingUser._id)}
                          disabled={isUnfollowing === followingUser._id}
                        >
                          {isUnfollowing === followingUser._id ? 'Unfollowing...' : 'Unfollow'}
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => navigate(`/chat?userId=${followingUser._id}`)}
                        >
                          Message
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <div className="text-center my-5">
                <p className="text-muted">Not following anyone yet</p>
              </div>
            )}
          </Row>
        )}

        {activeTab === "requests" && (
          <Row className="g-3 mb-5">
            {followRequests.length > 0 ? (
              followRequests.map((request) => (
                <Col key={request._id} md={6} lg={4}>
                  <Card className="h-100 shadow-sm border-0" style={{ borderRadius: "15px" }}>
                    <Card.Body className="d-flex align-items-center p-3">
                      <Image
                        src={request.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=avatar"}
                        roundedCircle
                        style={{ width: "50px", height: "50px", objectFit: "cover", cursor: "pointer" }}
                        className="me-3"
                        onClick={() => navigate(`/user/${request._id}`)}
                      />
                      <div className="flex-grow-1">
                        <h6 
                          className="mb-0" 
                          style={{ cursor: "pointer", color: "#667eea" }}
                          onClick={() => navigate(`/user/${request._id}`)}
                        >
                          {request.username}
                        </h6>
                        <small className="text-muted">Wants to follow you</small>
                      </div>
                      <div>
                        <Button
                          variant="success"
                          size="sm"
                          className="me-2"
                          onClick={() => acceptFollowRequest(request._id)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => rejectFollowRequest(request._id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <div className="text-center my-5">
                <p className="text-muted">No pending follow requests</p>
              </div>
            )}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default Profile;