import React from 'react'
import { Container, Row, Col, Card, Button, Nav, Badge, Image } from "react-bootstrap";
export default function Post(props) {
  return (
  <Col key={props.post.id} xs={12} sm={6} lg={4}>
  <Card 
    className="h-100 shadow-sm border-0 post-card" 
    style={{ 
      borderRadius: "15px",
      overflow: "hidden",
      cursor: "pointer",
      transition: "transform 0.3s"
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
  >
    <div style={{ position: "relative", paddingBottom: "100%", overflow: "hidden" }}>
      <img
        src={props.post.imageUrl}
        alt={props.post.caption}
        style={{ 
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
      />
      <div 
        className="overlay"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)",
          opacity: 0,
          transition: "opacity 0.3s",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: "20px"
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
      >
        <div className="text-white w-100">
          <p className="mb-2 fw-semibold">{props.post.caption}</p>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <div className="d-flex align-items-center">
              <span>❤️ {props.post.likes}</span>
            </div>
            <span>{props.post.timestamp}</span>
          </div>
          <div className="d-flex justify-content-between mt-3">
              <button className="btn btn-sm btn-outline-light d-flex align-items-center">
                <span className="me-1">❤️</span> Like
              </button>
              {props.edit==false?<></>:<button className="btn btn-sm btn-outline-light" >
                Edit
              </button>}
          </div>
        </div>
      </div>
    </div>
  </Card>
</Col>
  )}
