import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Nav, Badge, Image } from "react-bootstrap";
import { timeAgo } from './FeedPost';
import { useNavigate } from 'react-router-dom';

export default function Post({post, onLike, onDelete}) {
    const navigate = useNavigate(); 
    
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
    const isLiked = post.likes && post.likes.includes(currentUserId);

    const handleLike = async (postId) => {
        if (onLike) {
            onLike(postId);
        }
    };

    const handleDelete = async (postId) => {
        if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            try {
                const response = await fetch(`http://localhost:5000/deletePost/${postId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    // Call the onDelete prop to update the UI
                    if (onDelete) {
                        onDelete(postId);
                    }
                } else {
                    const errorData = await response.json();
                    alert(errorData.message || 'Failed to delete post');
                }
            } catch (error) {
                console.error('Delete error:', error);
                alert('Failed to delete post. Please try again.');
            }
        }
    }; 
    

    return (
    <Col key={post._id} xs={12} sm={6} lg={4}>
      <Card
        className="h-100 shadow-sm border-0"
        style={{
          borderRadius: "15px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "transform 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-5px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        <div style={{ position: "relative", paddingBottom: "100%", overflow: "hidden" }}>
          <img
            src={post.image || "https://placehold.co/600x600/f0f2f5/65676b?text=No+Image"}
            alt={post.title}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            className="overlay "
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
              padding: "20px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
          >
            <div className="text-white w-100 ">
              <p className="mb-2 fw-semibold">{post.title}</p>
              <p className="mb-2 small opacity-75">{post.content}</p>
                          <div className="d-flex align-items-center">
              <span>❤️ {post.likes ? post.likes.length : 0}</span>
            </div>
            <span>{timeAgo(post.timestamp)}</span>
          </div>
          <div className="d-flex justify-content-between mt-3">
              <button 
                className={`btn btn-sm d-flex align-items-center me-3 ${isLiked ? 'btn-danger' : 'btn-outline-light'}`}
                onClick={() => handleLike(post._id)}
              >
                <span className="me-1">❤️</span> {isLiked ? 'Unlike' : 'Like'}
              </button>

                <div className='d-flex align-items-center gap-2'>
                  <button 
                    className="btn btn-sm btn-outline-light me-2"
                    onClick={() => navigate(`/editPost/${post._id}`)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(post._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              
          </div>
            </div>
          </div>
      </Card>
    </Col>
  )}
