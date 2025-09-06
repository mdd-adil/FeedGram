import React, { useState, useEffect } from 'react'
import {  Card, Button, Image, Alert, Modal } from "react-bootstrap";
import { useNavigate } from 'react-router-dom';

// Function to format timestamp to "time ago"
export const timeAgo = (timestamp) => {
  if (!timestamp) return '';
  
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  
  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
};

export default function FeedPost(props) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteNotification, setDeleteNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const getCurrentUserId = () => {
    // You can decode the JWT token or store userId separately
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

  const handleMessage = (userId) => {
    navigate(`/chat?userId=${userId}`);
  };

  const currentUserId = getCurrentUserId();
  const isLiked = props.post.likes && props.post.likes.includes(currentUserId);

  // Check follow status when component mounts
  useEffect(() => {
    const checkFollowStatus = async () => {
      const postUserId = props.post.user?._id || props.post.user;
      if (postUserId && postUserId !== currentUserId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/user-profile/${postUserId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setIsFollowing(data.isFollowing || false);
            // Check if there's a pending follow request by looking at the user's data
            setFollowRequestSent(false); // We'll determine this from the response
          } else {
            console.log('Failed to check follow status');
          }
        } catch (error) {
          console.error('Error checking follow status:', error);
          // Set default states on error
          setIsFollowing(false);
          setFollowRequestSent(false);
        }
      }
    };

    checkFollowStatus();
  }, [props.post.user, currentUserId]);

  const handleFollow = async (userId) => {
    if (followLoading) return;
    
    try {
      setFollowLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/follow/follow/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.message && result.message.includes('request sent')) {
          setFollowRequestSent(true);
          setDeleteNotification('Follow request sent!');
        } else {
          setIsFollowing(true);
          setDeleteNotification('Successfully followed!');
        }
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to follow user' }));
        throw new Error(errorData.message || 'Failed to follow user');
      }
    } catch (error) {
      console.error('Follow error:', error);
      setDeleteNotification(error.message || 'Failed to follow user');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async (userId) => {
    if (followLoading) return;
    
    try {
      setFollowLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/follow/unfollow/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsFollowing(false);
        setFollowRequestSent(false);
        setDeleteNotification('Successfully unfollowed!');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to unfollow user' }));
        throw new Error(errorData.message || 'Failed to unfollow user');
      }
    } catch (error) {
      console.error('Unfollow error:', error);
      setDeleteNotification(error.message || 'Failed to unfollow user');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (props.onLike) {
      props.onLike(postId);
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
            if (props.onDelete) {
                props.onDelete(postId);
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

  // Generate avatar from username if no avatar available
  const getAvatarSrc = () => {
    // console.log('Post data:', props.post);
    // console.log('User data:', props.post.user);
    if (props.post.user?.avatar) {
      return props.post.user.avatar;
    }
    const username = props.post.user?.username || props.post.username || 'User';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
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
          <Button variant="danger" onClick={() => handleDelete(props.post._id)}>
            Delete Post
          </Button>
        </Modal.Footer>
      </Modal>

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
              src={getAvatarSrc()}
              roundedCircle
              style={{ 
                width: "45px", 
                height: "45px",
                marginRight: "12px",
                border: "2px solid #667eea",
                objectFit: "cover",
                cursor: "pointer"
              }}
              alt="User Avatar"
              onClick={() => navigate(`/user/${props.post.user?._id || props.post.user}`)}
            />
            <div className="flex-grow-1">
              <div className="d-flex align-items-center justify-content-between">
                <h6 
                  className="mb-0 fw-bold" 
                  style={{ cursor: "pointer", color: "#667eea" }}
                  onClick={() => navigate(`/user/${props.post.user?._id || props.post.user}`)}
                >
                  {props.post.user?.username || props.post.username}
                </h6>
                {/* Follow button for other users */}
                {(props.post.user?._id !== currentUserId && props.post.user !== currentUserId) && (
                  <div className="ms-2 d-flex gap-2">
                    {isFollowing ? (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleUnfollow(props.post.user?._id || props.post.user)}
                        disabled={followLoading}
                        style={{ borderRadius: "15px", fontSize: "17px", padding: "2px 8px" }}
                      >
                        {followLoading ? 'Loading...' : 'Unfollow'}
                      </Button>
                    ) : followRequestSent ? (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        disabled
                        style={{ borderRadius: "15px", fontSize: "17px", padding: "2px 8px" }}
                      >
                        Requested
                      </Button>
                    ) : (
                      <Button
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                          borderRadius: "15px",
                          fontSize: "17px",
                          padding: "2px 8px"
                        }}
                        size="sm"
                        onClick={() => handleFollow(props.post.user?._id || props.post.user)}
                        disabled={followLoading}
                      >
                        {followLoading ? 'Loading...' : 'Follow'}
                      </Button>
                    )}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleMessage(props.post.user?._id || props.post.user)}
                      style={{ borderRadius: "15px", fontSize: "17px", padding: "2px 8px" }}
                    >
                      Message
                    </Button>
                  </div>
                )}
              </div>
              <small className="text-muted">{timeAgo(props.post.timestamp)}</small>
            </div>
            {/* Three dots menu - only show for posts owned by current user */}
            {(props.post.user?._id === currentUserId || props.post.user === currentUserId) && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={confirmDelete}
                style={{ 
                  borderRadius: "50%", 
                  width: "35px", 
                  height: "35px",
                  color: "#dc3545"
                }}
                title="Delete post"
              >
                🗑️
              </Button>
            )}
          </div>

          {/* Post Caption */}
          <h6 className="mb-2 fw-bold">{props.post.title}</h6>
          <p className="mb-3 text-muted">{props.post.content}</p>

          {/* Post Image */}
          {props.post.image && (
            <div style={{ 
              margin: "0 -1.5rem",
              marginBottom: "15px"
            }}>
              <img
                src={props.post.image}
                alt={props.post.title}
                style={{ 
                  width: "100%",
                  height: "auto",
                  maxHeight: "500px",
                  objectFit: "cover"
                }}
              />
            </div>
          )}

          {/* Post Stats */}
          <div className="d-flex justify-content-between align-items-center mb-3 px-2">
            <div className="d-flex align-items-center">
              <span style={{ fontSize: "18px", marginRight: "5px" }}>❤️</span>
              <span className="text-muted">{props.post.likes ? props.post.likes.length : 0} likes</span>
            </div>
          </div>

          {/* Post Actions */}
          <div className="d-flex justify-content-around border-top pt-2">
            <Button
              variant="light"
              className="flex-grow-1 border-0"
              onClick={() => handleLike(props.post._id)}
              style={{ 
                color: isLiked ? "#e91e63" : "#65676b",
                background: !isLiked ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" : "transparent",
                fontWeight:"600"
              }}
            >
              {isLiked ? "🤍 Unlike" : " ❤️Like"}
            </Button>
            
            
            
            {/* <Button
              variant="light"
              className="flex-grow-1 border-0"
              style={{ 
                color: "#65676b",
                backgroundColor: "transparent",
                fontWeight: "600"
              }}
            >
              📤 Share
            </Button> */}
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
