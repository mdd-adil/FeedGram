import { useState,useEffect } from "react";
import { Container, Card, Button, Row, Col, Image, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import FeedPost from "./FeedPost";
import axios from "axios";


const Home = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([
    // {
    //   id: 1,
    //   userId: 1,
    //   userName: "Sarah Johnson",
    //   userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    //   userVerified: true,
    //   imageUrl: "https://picsum.photos/600/600?random=1",
    //   caption: "Beautiful sunset at the beach 🌅 Nature never fails to amaze me!",
    //   likes: 234,
    //   isLiked: false,
    //   comments: 12,
    //   timestamp: "2 hours ago",
    // },
    // {
    //   id: 2,
    //   userId: 2,
    //   userName: "Mike Chen",
    //   userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    //   userVerified: false,
    //   imageUrl: "https://picsum.photos/600/600?random=2",
    //   caption: "Coffee and code ☕💻 Perfect morning vibes",
    //   likes: 189,
    //   isLiked: true,
    //   comments: 8,
    //   timestamp: "5 hours ago",
    // },
    // {
    //   id: 3,
    //   userId: 3,
    //   userName: "Emma Watson",
    //   userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    //   userVerified: true,
    //   imageUrl: "https://picsum.photos/600/600?random=3",
    //   caption: "Mountain hiking adventures 🏔️ The view was worth every step!",
    //   likes: 456,
    //   isLiked: false,
    //   comments: 23,
    //   timestamp: "1 day ago",
    // },
    // {
    //   id: 4,
    //   userId: 4,
    //   userName: "Alex Rivera",
    //   userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    //   userVerified: false,
    //   imageUrl: "https://picsum.photos/600/600?random=4",
    //   caption: "City lights at night 🌃 Never gets old",
    //   likes: 321,
    //   isLiked: true,
    //   comments: 15,
    //   timestamp: "2 days ago",
    // },
    // {
    //   id: 5,
    //   userId: 5,
    //   userName: "Lisa Park",
    //   userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    //   userVerified: true,
    //   imageUrl: "https://picsum.photos/600/600?random=5",
    //   caption: "Weekend vibes 🎉 Making memories with the best people",
    //   likes: 278,
    //   isLiked: false,
    //   comments: 19,
    //   timestamp: "3 days ago",
    // },
    // {
    //   id: 6,
    //   userId: 6,
    //   userName: "Tom Wilson",
    //   userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
    //   userVerified: false,
    //   imageUrl: "https://picsum.photos/600/600?random=6",
    //   caption: "Nature photography 📸 Found this hidden gem today",
    //   likes: 412,
    //   isLiked: false,
    //   comments: 31,
    //   timestamp: "4 days ago",
    // },
  ]);



  useEffect(() => {
    const fetchPosts = async () => {
      try {
         const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/home",{ headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      });
        setPosts(res.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    fetchPosts();
  }, []);

  const handleProfileClick = async () => {
   
      navigate('/profile');
    
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/logout', {}, { withCredentials: true });
      localStorage.removeItem("token");
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error.message);
      // localStorage.removeItem("token");
      // navigate('/login');
    }
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
              FeedGram
            </h2>
            <div>
                <Button 
                className="me-3"
                  variant="outline-light"
                 onClick={handleProfileClick}
                 style={{ borderRadius: "20px" ,
                   background:"linear-gradient(135deg, #6d56d5ff 0%, #418bcfff 100%)",
                }}
                >
                  Profile
                </Button>
              
              <Button 
                variant="outline-light"
                onClick={handleLogout}
                style={{ borderRadius: "20px" ,
                   background:"linear-gradient(135deg, #6d56d5ff 0%, #418bcfff 100%)",
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
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser"
                    roundedCircle
                    style={{ width: "40px", height: "40px", marginRight: "15px" }}
                  />
                  <Button 
                    variant="light"
                    className="flex-grow-1 text-start"
                    style={{ 
                      borderRadius: "25px",
                      padding: "10px 20px",
                      backgroundColor: "#f0f2f5",
                      border: "1px solid #ddd",
                      color: "#65676b"
                    }}
                  >
                    What's on your mind?
                  </Button>
                  <Button
                    style={{ 
                      marginLeft: "10px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      border: "none"
                    }}
                  >
                    📸 Photo
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Posts Feed */}
            {posts.map((post) => <FeedPost post={post}/>)}
              
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