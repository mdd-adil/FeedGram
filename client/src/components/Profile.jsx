import { useState } from "react";
import { Container, Row, Col, Card, Button, Nav, Badge, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Post from "./Post";
import axios from "axios";


const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  
  // Mock user data
  const user = {
    name: "John Doe",
    username: "@johndoe",
    bio: "Full Stack Developer | Tech Enthusiast | Coffee Lover ☕",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    posts: 42,
    followers: 1234,
    following: 567,
    verified: true,
  };

  // Mock posts data
  const posts= [
    {
      id: 1,
      imageUrl: "https://picsum.photos/400/400?random=1",
      caption: "Beautiful sunset at the beach 🌅",
      likes: 234,
      comments: 12,
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      imageUrl: "https://picsum.photos/400/400?random=2",
      caption: "Coffee and code ☕💻",
      likes: 189,
      comments: 8,
      timestamp: "5 hours ago",
    },
    {
      id: 3,
      imageUrl: "https://picsum.photos/400/400?random=3",
      caption: "Mountain hiking adventures 🏔️",
      likes: 456,
      comments: 23,
      timestamp: "1 day ago",
    },
    {
      id: 4,
      imageUrl: "https://picsum.photos/400/400?random=4",
      caption: "City lights at night 🌃",
      likes: 321,
      comments: 15,
      timestamp: "2 days ago",
    },
    {
      id: 5,
      imageUrl: "https://picsum.photos/400/400?random=5",
      caption: "Weekend vibes 🎉",
      likes: 278,
      comments: 19,
      timestamp: "3 days ago",
    },
    {
      id: 6,
      imageUrl: "https://picsum.photos/400/400?random=6",
      caption: "Nature photography 📸",
      likes: 412,
      comments: 31,
      timestamp: "4 days ago",
    },
  ];

  const handleLogout = async () => {
    try {
        // Send the POST request with the 'withCredentials' option
        const response = await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
        
        // Remove the token from localStorage (optional, but good practice)
        localStorage.removeItem("token");
        
        // Log the response from the server for confirmation
        console.log(response.data);
        
        // Redirect the user to the login page
        navigate('/login');
    } catch (error) {
        // Log the detailed error message
        console.error('Logout error:', error.message);
    }
};

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
                variant="light" 
                className="me-2"
                style={{ borderRadius: "20px" }}
              >
                Settings
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
                    src={user.avatar}
                    roundedCircle
                    style={{ 
                      width: "150px", 
                      height: "150px",
                      border: "4px solid #667eea"
                    }}
                  />
                  {user.verified && (
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
                  )}
                </div>
              </Col>
              <Col md={9}>
                <div className="mt-3 mt-md-0">
                  <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3">
                    <div>
                      <h3 className="mb-0 fw-bold">{user.name}</h3>
                      <p className="text-muted mb-2">{user.username}</p>
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
                      >
                        Edit Profile
                      </Button>
                      <Button 
                        variant="outline-secondary"
                        style={{ borderRadius: "20px", padding: "8px 30px" }}
                      >
                        Share
                      </Button>
                    </div>
                  </div>
                  
                  <p className="mb-3">{user.bio}</p>
                  
                  <Row className="text-center text-md-start">
                    <Col xs={4} md={2}>
                      <h5 className="fw-bold mb-0" style={{ color: "#667eea" }}>{user.posts}</h5>
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
          <Row className="g-3 mb-5">
            {posts.map((post) => (
              <Post post={post}/>
            ))}
          </Row>
        }

       
      </Container>
    </div>
  );
};

export default Profile;