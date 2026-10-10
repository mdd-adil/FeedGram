import React, { useState, useEffect, memo } from 'react';
import { Image, Alert, Modal, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

// Memory cache to prevent N+1 duplicate network requests across feed posts
const followStatusCache = new Map();

// Optimized helper for time formatting
export const timeAgo = (timestamp) => {
  if (!timestamp) return '';
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

function FeedPost({ post, currentUserId: propCurrentUserId, onLike, onDelete }) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getEffectiveUserId = () => {
    if (propCurrentUserId) return propCurrentUserId;
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

  const currentUserId = getEffectiveUserId();
  const postUserId = post.user?._id || post.user;
  const isPostOwner = currentUserId && (postUserId === currentUserId);
  const isLiked = Array.isArray(post.likes) && post.likes.includes(currentUserId);

  // Check follow status with in-memory caching to eliminate N+1 fetches
  useEffect(() => {
    if (!postUserId || isPostOwner) return;

    if (followStatusCache.has(postUserId)) {
      const cached = followStatusCache.get(postUserId);
      setIsFollowing(cached.isFollowing);
      setFollowRequestSent(cached.followRequestSent);
      return;
    }

    let isMounted = true;
    const checkFollowStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/user-profile/${postUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const status = {
            isFollowing: !!data.isFollowing,
            followRequestSent: !!data.followRequestSent
          };
          followStatusCache.set(postUserId, status);

          if (isMounted) {
            setIsFollowing(status.isFollowing);
            setFollowRequestSent(status.followRequestSent);
          }
        }
      } catch (error) {
        console.error('Follow check error:', error);
      }
    };

    checkFollowStatus();

    return () => {
      isMounted = false;
    };
  }, [postUserId, isPostOwner]);

  const showToast = (message) => {
    setNotification(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleFollowToggle = async () => {
    if (followLoading || !postUserId) return;
    setFollowLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (isFollowing) {
        // Unfollow
        const response = await fetch(`${API_BASE_URL}/follow/unfollow/${postUserId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsFollowing(false);
          setFollowRequestSent(false);
          followStatusCache.set(postUserId, { isFollowing: false, followRequestSent: false });
          showToast('Unfollowed');
        } else {
          showToast('Failed to unfollow');
        }
      } else {
        // Follow
        const response = await fetch(`${API_BASE_URL}/follow/follow/${postUserId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.message && result.message.includes('request sent')) {
            setFollowRequestSent(true);
            followStatusCache.set(postUserId, { isFollowing: false, followRequestSent: true });
            showToast('Follow request sent');
          } else {
            setIsFollowing(true);
            followStatusCache.set(postUserId, { isFollowing: true, followRequestSent: false });
            showToast('Following');
          }
        } else {
          showToast('Failed to follow');
        }
      }
    } catch (err) {
      console.error('Follow error:', err);
      showToast('Action failed');
    } finally {
      setFollowLoading(false);
    }
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

  const getAvatarSrc = () => {
    if (post.user?.avatar) return post.user.avatar;
    const username = post.user?.username || post.username || 'User';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
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
          Are you sure you want to delete this post? This action cannot be undone.
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

      {/* Minimalist Card */}
      <article className="minimal-card">
        {/* Header */}
        <header className="post-header">
          <div className="d-flex align-items-center">
            <Image
              src={getAvatarSrc()}
              className="post-avatar"
              onClick={() => navigate(`/user/${postUserId}`)}
              alt={post.user?.username || 'User'}
            />
            <div className="post-user-info">
              <span
                className="post-username"
                onClick={() => navigate(`/user/${postUserId}`)}
              >
                {post.user?.username || post.username || 'Anonymous'}
              </span>
              <span className="post-timestamp">{timeAgo(post.timestamp)}</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {!isPostOwner && (
              <>
                <button
                  className={`btn-minimal btn-minimal-sm ${
                    isFollowing ? 'btn-minimal-secondary' : 'btn-minimal-primary'
                  }`}
                  onClick={handleFollowToggle}
                  disabled={followLoading || followRequestSent}
                >
                  {followLoading ? (
                    <Spinner animation="border" size="sm" />
                  ) : isFollowing ? (
                    'Following'
                  ) : followRequestSent ? (
                    'Requested'
                  ) : (
                    'Follow'
                  )}
                </button>
                <button
                  className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                  onClick={() => navigate(`/chat?userId=${postUserId}`)}
                  title="Message user"
                >
                  Message
                </button>
              </>
            )}

            {isPostOwner && (
              <button
                className="btn-icon-minimal"
                onClick={() => setShowDeleteModal(true)}
                title="Delete post"
              >
                <span style={{ fontSize: '0.9rem' }}>🗑️</span>
              </button>
            )}
          </div>
        </header>

        {/* Post Content */}
        <div className="post-body">
          {post.title && <h3 className="post-title">{post.title}</h3>}
          {post.content && <p className="post-text">{post.content}</p>}
        </div>

        {/* Media */}
        {post.image && (
          <div className="post-media">
            <img
              src={post.image}
              alt={post.title || 'Post attachment'}
              className="post-image"
              loading="lazy"
            />
          </div>
        )}

        {/* Footer Actions */}
        <footer className="post-footer">
          <div className="d-flex align-items-center gap-3">
            <button
              className={`post-action-btn ${isLiked ? 'active-like' : ''}`}
              onClick={() => onLike && onLike(post._id)}
              aria-label={isLiked ? 'Unlike post' : 'Like post'}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              <span>{post.likes ? post.likes.length : 0}</span>
            </button>

            <button
              className="post-action-btn"
              onClick={() => navigate(`/chat?userId=${postUserId}`)}
              aria-label="Send direct message"
            >
              <span>💬</span>
              <span>Chat</span>
            </button>
          </div>
        </footer>
      </article>
    </>
  );
}

export default memo(FeedPost);
