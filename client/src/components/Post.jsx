import React, {  useState } from 'react'
import {  Col, Card, Button, Modal, Alert } from "react-bootstrap";
import { timeAgo } from './FeedPost';
import { useNavigate } from 'react-router-dom';

export default function Post({post, onLike, onDelete}) {
    const navigate = useNavigate(); 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteNotification, setDeleteNotification] = useState('');
    const [showNotification, setShowNotification] = useState(false);
    
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
        setShowDeleteModal(false);
        try {
            const response = await fetch(`http://localhost:5000/deletePost/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Show success notification
                setDeleteNotification('Post deleted successfully!');
                setShowNotification(true);
                
                // Hide notification after 3 seconds
                setTimeout(() => {
                    setShowNotification(false);
                }, 3000);

                // Call the onDelete prop to update the UI
                if (onDelete) {
                    onDelete(postId);
                }
            } else {
                const errorData = await response.json();
                setDeleteNotification(errorData.message || 'Failed to delete post');
                setShowNotification(true);
                setTimeout(() => {
                    setShowNotification(false);
                }, 3000);
            }
        } catch (error) {
            console.error('Delete error:', error);
            setDeleteNotification('Failed to delete post. Please try again.');
            setShowNotification(true);
            setTimeout(() => {
                setShowNotification(false);
            }, 3000);
        }
    };

    const confirmDelete = () => {
        setShowDeleteModal(true);
    };

    return (
        <>
            {/* Notification Alert */}
            {showNotification && (
                <Alert 
                    variant={deleteNotification.includes('successfully') ? 'success' : 'danger'}
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
                    {deleteNotification}
                </Alert>
            )}

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this post? This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(post._id)}>
                        Delete Post
                    </Button>
                </Modal.Footer>
            </Modal>

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
                    {/* Post Image */}
                    {post.image && (
                        <div
                            onClick={() => navigate(`/editPost/${post._id}`)}
                            style={{ height: "300px", overflow: "hidden" }}
                        >
                            <Card.Img
                                variant="top"
                                src={post.image}
                                style={{
                                    height: "100%",
                                    objectFit: "cover",
                                    width: "100%",
                                }}
                            />
                        </div>
                    )}

                    <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                                <Card.Title 
                                    className="h6 mb-2 fw-bold" 
                                    style={{ 
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                    }}
                                >
                                    {post.title}
                                </Card.Title>
                                <Card.Text 
                                    className="text-muted small mb-2"
                                    style={{ 
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                    }}
                                >
                                    {post.content}
                                </Card.Text>
                                <small className="text-muted">{timeAgo(post.timestamp)}</small>
                            </div>
                            
                            {/* Delete button */}
                            {currentUserId===post.userId && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDelete();
                                }}
                                style={{ 
                                    borderRadius: "50%", 
                                    width: "30px", 
                                    height: "30px",
                                    padding: "0",
                                    fontSize: "12px"
                                }}
                                title="Delete post"
                            >
                                🗑️
                            </Button>)}
                        </div>

                        {/* Post stats and actions */}
                        <div className="mt-3 pt-2 border-top">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                    <span style={{ fontSize: "14px", marginRight: "5px" }}>❤️</span>
                                    <span className="text-muted small">{post.likes ? post.likes.length : 0} likes</span>
                                </div>
                                <Button
                                    variant="light"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLike(post._id);
                                    }}
                                    style={{ 
                                        color: isLiked ? "#e91e63" : "#65676b",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        fontWeight: "600",
                                        fontSize: "12px"
                                    }}
                                >
                                    {isLiked ? " 🤍 Unlike" : "❤️ Like"}
                                </Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </>
    );
}
