import React, { useState, memo } from 'react';
import { Col, Card, Modal, Alert } from 'react-bootstrap';
import { timeAgo } from './FeedPost';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

function Post({ post, onLike, onDelete }) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      } catch {
        return null;
      }
    }
    return null;
  };

  const currentUserId = getCurrentUserId();
  const isPostOwner = currentUserId && (currentUserId === post.userId || currentUserId === post.user?._id || currentUserId === post.user);
  const isLiked = Array.isArray(post.likes) && post.likes.includes(currentUserId);

  const showToast = (message) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`${API_BASE_URL}/deletePost/${post._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setShowDeleteModal(false);
        if (onDelete) onDelete(post._id);
      } else {
        showToast('Failed to delete post');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error deleting post');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      {showNotification && (
        <Alert
          variant="dark"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-dropdown)',
            fontSize: '0.875rem'
          }}
          dismissible
          onClose={() => setShowNotification(false)}
        >
          {notification}
        </Alert>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>Delete Post</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Are you sure you want to delete this post?
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end gap-2">
          <button
            className="btn-minimal btn-minimal-secondary btn-minimal-sm"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="btn-minimal btn-minimal-danger btn-minimal-sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </Modal.Footer>
      </Modal>

      <Col xs={12} sm={6} lg={4}>
        <Card
          className="h-100 minimal-card m-0"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          {/* Post Media */}
          {post.image && (
            <div
              style={{
                height: '200px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-subtle)',
                cursor: isPostOwner ? 'pointer' : 'default',
              }}
              onClick={() => {
                if (isPostOwner) navigate(`/editPost/${post._id}`);
              }}
            >
              <Card.Img
                variant="top"
                src={post.image}
                loading="lazy"
                style={{
                  height: '100%',
                  objectFit: 'cover',
                  width: '100%',
                }}
              />
            </div>
          )}

          <Card.Body className="p-3 d-flex flex-column justify-content-between flex-grow-1">
            <div>
              <div className="d-flex justify-content-between align-items-start mb-1">
                <Card.Title
                  className="mb-1"
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {post.title}
                </Card.Title>

                {isPostOwner && (
                  <button
                    className="btn-icon-minimal"
                    style={{ width: '28px', height: '28px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteModal(true);
                    }}
                    title="Delete post"
                  >
                    🗑️
                  </button>
                )}
              </div>

              <Card.Text
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '0.5rem',
                }}
              >
                {post.content}
              </Card.Text>
              <small className="post-timestamp">{timeAgo(post.timestamp)}</small>
            </div>

            {/* Bottom Row */}
            <div
              className="mt-3 pt-2 d-flex justify-content-between align-items-center"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <div className="d-flex align-items-center gap-1">
                <span style={{ fontSize: '0.85rem' }}>❤️</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {post.likes ? post.likes.length : 0}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                {isPostOwner && (
                  <button
                    className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    onClick={() => navigate(`/editPost/${post._id}`)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="post-action-btn"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onLike) onLike(post._id);
                  }}
                >
                  {isLiked ? '❤️ Liked' : '🤍 Like'}
                </button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
}

export default memo(Post);
