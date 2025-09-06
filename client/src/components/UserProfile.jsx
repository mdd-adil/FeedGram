import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Image, Button, Nav, Badge, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Post from './Post';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);

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

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    if (userId) {
      // Check if user is trying to view their own profile
      if (userId === currentUserId) {
        navigate('/profile');
        return;
      }
      
      setError(''); // Clear previous errors
      setLoading(true); // Show loading state
      fetchUserProfile();
    }
  }, [userId, currentUserId, navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('Fetching user profile for userId:', userId);
      console.log('Token available:', !!token);
      
      // Fetch user profile
      const profileResponse = await axios.get(`http://localhost:5000/user-profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Profile response:', profileResponse.data);
      
      setUser(profileResponse.data.user);
      
      // Check if user is private and we're not following
      if (!profileResponse.data.user.isPrivate || profileResponse.data.canViewPosts) {
        setPosts(profileResponse.data.posts || []);
      }
      
      // Set follow status
      setIsFollowing(profileResponse.data.isFollowing || false);
      setFollowRequestSent(profileResponse.data.followRequestSent || false);
      
      // Fetch followers and following if allowed
      if (!profileResponse.data.user.isPrivate || profileResponse.data.canViewPosts) {
        await fetchFollowersAndFollowing();
      }
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Error response:', error.response?.data);
      setError('Error loading user profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowersAndFollowing = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`http://localhost:5000/follow/followers/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:5000/follow/following/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setFollowers(followersRes.data.followers || []);
      setFollowing(followingRes.data.following || []);
    } catch (error) {
      console.error('Error fetching followers/following:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (isFollowing) {
        // Unfollow
        await axios.delete(`http://localhost:5000/follow/unfollow/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        setUser(prev => ({
          ...prev,
          followersCount: (prev.followersCount || 0) - 1
        }));
        // Show notification
        setNotification('Successfully unfollowed user');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        // Refresh followers list
        await fetchFollowersAndFollowing();
      } else {
        // Follow
        const response = await axios.post(`http://localhost:5000/follow/follow/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (user.isPrivate) {
          setFollowRequestSent(true);
          setNotification('Follow request sent to private account');
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
        } else {
          setIsFollowing(true);
          setUser(prev => ({
            ...prev,
            followersCount: (prev.followersCount || 0) + 1
          }));
          setNotification('Successfully followed user');
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 3000);
          // Refresh followers list
          await fetchFollowersAndFollowing();
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      setNotification('Error updating follow status');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  const renderFollowButton = () => {
    if (currentUserId === userId) {
      return null; // Don't show follow button for own profile
    }

    if (isFollowing) {
      return (
        <Button
          variant="outline-danger"
          size="sm"
          onClick={handleFollow}
          style={{ borderRadius: "20px", padding: "8px 20px" }}
        >
          Unfollow
        </Button>
      );
    } else if (followRequestSent) {
      return (
        <Button
          variant="outline-secondary"
          size="sm"
          disabled
          style={{ borderRadius: "20px", padding: "8px 20px" }}
        >
          Request Sent
        </Button>
      );
    } else {
      return (
        <Button
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            borderRadius: "20px",
            padding: "8px 20px"
          }}
          size="sm"
          onClick={handleFollow}
        >
          Follow
        </Button>
      );
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <p className="text-danger">{error}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Container>
    );
  }

  const canViewContent = !user.isPrivate || isFollowing;

  return (
    <Container className="py-5">
      {/* Notification Alert */}
      {showNotification && (
        <Alert 
          variant={notification.includes('Successfully') || notification.includes('sent') ? 'success' : 'danger'}
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

      {/* Back Button */}
      <Row className="justify-content-center mb-3">
        <Col md={8}>
          <Button
            variant=""
            onClick={() => navigate(-1)}
            style={{ 
                color:"#fff",
               backgroundColor:"#667eea",
              borderRadius: "20px",
              padding: "8px 20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              width: "fit-content"
            }}
          >
            <span>←</span> Back
          </Button>
        </Col>
      </Row>
      
      {/* Profile Header */}
      <Row className="justify-content-center mb-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm" style={{ borderRadius: "20px" }}>
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={3} className="text-center">
                  <Image
                    src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=avatar"}
                    roundedCircle
                    style={{ width: "120px", height: "120px", objectFit: "cover" }}
                    className="border border-3 border-light shadow"
                  />
                </Col>
                <Col md={9}>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h3 className="mb-1">{user.username}</h3>
                      <p className="text-muted mb-0">{user.email}</p>
                      {user.isPrivate && (
                        <Badge bg="secondary" className="mt-1">
                          Private Account
                        </Badge>
                      )}
                    </div>
                    {renderFollowButton()}
                  </div>
                  
                  {user.bio && (
                    <p className="mb-3">{user.bio}</p>
                  )}
                  
                  <Row className="text-center">
                    <Col>
                      <h5 className="mb-0">{posts.length}</h5>
                      <small className="text-muted">Posts</small>
                    </Col>
                    <Col>
                      <h5 className="mb-0">{user.followersCount || 0}</h5>
                      <small className="text-muted">Followers</small>
                    </Col>
                    <Col>
                      <h5 className="mb-0">{user.followingCount || 0}</h5>
                      <small className="text-muted">Following</small>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Navigation Tabs */}
      {canViewContent && (
        <Row className="justify-content-center mb-4">
          <Col md={8}>
            <Nav variant="pills" className="justify-content-center" style={{ gap: "10px" }}>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "posts"}
                  onClick={() => setActiveTab("posts")}
                  style={{
                    borderRadius: "20px",
                    backgroundColor: activeTab === "posts" ? "" : "transparent",
                    border: activeTab === "posts" ? "none" : "1px solid #dee2e6",
                    color: activeTab === "posts" ? "white" : "black"
                  }}
                >
                  Posts
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "followers"}
                  onClick={() => setActiveTab("followers")}
                  style={{
                    borderRadius: "20px",
                    backgroundColor: activeTab === "followers" ? "#667eea" : "transparent",
                    border: activeTab === "followers" ? "none" : "1px solid #dee2e6",
                    color: activeTab === "followers" ? "white" : "black"
                  }}
                >
                  Followers
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "following"}
                  onClick={() => setActiveTab("following")}
                  style={{
                    borderRadius: "20px",
                    backgroundColor: activeTab === "following" ? "#667eea" : "transparent",
                    border: activeTab === "following" ? "none" : "1px solid #dee2e6",
                    color: activeTab === "following" ? "white" : "black"
                  }}
                >
                  Following
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
        </Row>
      )}

      {/* Content Area */}
      <Row className="justify-content-center">
        <Col md={8}>
          {!canViewContent ? (
            <div className="text-center my-5">
              <i className="fas fa-lock fa-3x text-muted mb-3"></i>
              <h4>This Account is Private</h4>
              <p className="text-muted">Follow this account to see their posts.</p>
            </div>
          ) : (
            <>
              {/* Tab Content */}
              {activeTab === "posts" && (
                posts.length > 0 ? (
                  <Row className="g-3 mb-5">
                    {posts.map((post) => (
                      <Post key={post._id} post={post} />
                    ))}
                  </Row>
                ) : (
                  <div className="text-center my-5">
                    <p className="text-muted">No posts yet.</p>
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
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/user/${follower._id}`)}
                            >
                              View
                            </Button>
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
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/user/${followingUser._id}`)}
                            >
                              View
                            </Button>
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
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;
