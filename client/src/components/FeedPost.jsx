import React from 'react'
import { Container, Card, Button, Row, Col, Image, Badge } from "react-bootstrap";
export default function FeedPost(props) {
      const handleLike = (postId) => {
    
      
    };
  
  return (
    <Card 
                key={props.post._id} 
                className="mb-4 shadow-sm border-0" 
                style={{ 
                  borderRadius: "15px",
                  overflow: "hidden"
                }}
              >
                <Card.Body className="p-4">
                  {/* Post Header */}
                  <div className="d-flex align-items-center mb-3">
                    <Image
                      // src={props.post.userAvatar}
                      roundedCircle
                      style={{ 
                        width: "45px", 
                        height: "45px",
                        marginRight: "12px",
                        border: "2px solid #667eea"
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center">
                        {/* <h6 className="mb-0 fw-bold">{props.post.userName}</h6> */}
                        {/* {props.post.userVerified && (
                          <Badge 
                            bg="primary" 
                            className="ms-2"
                            style={{ 
                              fontSize: "10px",
                              padding: "2px 5px"
                            }}
                          >
                            ✓
                          </Badge>
                        )} */}
                      </div>
                      <small className="text-muted">{Date.now-props.post.timestamp}</small>
                    </div>
                    <Button
                      variant="light"
                      size="sm"
                      style={{ borderRadius: "50%", width: "35px", height: "35px" }}
                    >
                      •••
                    </Button>
                  </div>

                  {/* Post Caption */}
                  <p className="mb-3">{props.post.title}</p>

                  {/* Post Image */}
                  <div style={{ 
                    margin: "0 -1.5rem",
                    marginBottom: "15px"
                  }}>
                    <img
                      // src={props.post.imageUrl}
                      // alt={props.post.caption}
                      style={{ 
                        width: "100%",
                        height: "auto",
                        maxHeight: "500px",
                        objectFit: "cover"
                      }}
                    />
                  </div>

                  {/* Post Stats */}
                  <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                    <div className="d-flex align-items-center">
                      <span style={{ fontSize: "18px", marginRight: "5px" }}>❤️</span>
                      <span className="text-muted">{props.post.length} likes</span>
                    </div>
                   
                  </div>

                  {/* Post Actions */}
                  <div className="d-flex justify-content-around border-top pt-2">
                    <Button
                      variant="light"
                      className="flex-grow-1 border-0"
                      onClick={() => handleLike(props.post._id)}
                      // style={{ 
                      //   background: !props.post.isLiked 
                      //     ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
                      //     : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      //   color: props.post.isLiked ? "white" : "white",
                      //   borderRadius: "10px",
                      //   margin: "0 5px",
                      //   transition: "all 0.3s"
                      // }}
                    >
                      <span style={{ fontSize: "20px", marginRight: "5px" }}>
                        {/* {props.post.isLiked ? "❤️" : "🤍"} */}
                      </span>
                                             {/* {props.post.isLiked ? "Like" : "Unlike"} */}
                    </Button>
                    {/* <Button
                      variant="light"
                      className="flex-grow-1 border-0"
                      style={{ 
                        background: "transparent",
                        color: "#65676b",
                        borderRadius: "10px",
                        margin: "0 5px"
                      }}
                    > */}
                      {/* <span style={{ fontSize: "20px", marginRight: "5px" }}>💬</span>
                      Comment
                    </Button>
                    <Button
                      variant="light"
                      className="flex-grow-1 border-0"
                      style={{ 
                        background: "transparent",
                        color: "#65676b",
                        borderRadius: "10px",
                        margin: "0 5px"
                      }}
                    >
                      <span style={{ fontSize: "20px", marginRight: "5px" }}>📤</span>
                      Share
                    </Button> */}
                  </div>
                </Card.Body>
              </Card>
            )}



