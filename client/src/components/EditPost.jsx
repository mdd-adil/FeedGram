import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Alert, Spinner, Container, Modal } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const EditPost = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/updatePost/${postId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const post = response.data.post;
        if (post) {
          setTitle(post.title || '');
          setContent(post.content || '');
          setImagePreview(post.image || '');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(err.response?.data?.message || 'Failed to load post');
        if (err.response?.status === 401) {
          navigate('/login');
        } else if (err.response?.status === 403) {
          navigate('/home');
        }
      } finally {
        setInitialLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      await axios.put(`${API_BASE_URL}/updatePost/${postId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      sessionStorage.removeItem('home_posts_cache');
      setSuccess('Post updated successfully');
      setTimeout(() => navigate('/home'), 1000);
    } catch (err) {
      console.error('Update post error:', err);
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/deletePost/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      sessionStorage.removeItem('home_posts_cache');
      setShowDeleteModal(false);
      navigate('/home');
    } catch (err) {
      console.error('Delete post error:', err);
      setError(err.response?.data?.message || 'Failed to delete post');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="app-container d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="dark" />
      </div>
    );
  }

  return (
    <div className="app-container">
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

      {/* Header */}
      <header className="navbar-minimal">
        <Container className="d-flex align-items-center justify-content-between">
          <div
            className="brand-title cursor-pointer"
            onClick={() => navigate('/home')}
          >
            <span className="brand-dot"></span>
            <span>FeedGram</span>
          </div>

          <button
            className="btn-minimal btn-minimal-secondary btn-minimal-sm"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </Container>
      </header>

      {/* Main Form */}
      <main className="container py-4" style={{ maxWidth: '640px' }}>
        <Card className="minimal-card p-4">
          <div className="mb-4">
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '0.25rem'
              }}
            >
              Edit Post
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
              Update your post caption or attachment
            </p>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Attachment</Form.Label>
              {imagePreview && (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '0.75rem'
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Current upload"
                    style={{
                      width: '100%',
                      maxHeight: '340px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="form-control"
              />
              <small className="text-muted d-block mt-1">Leave empty to keep existing image</small>
            </Form.Group>

            {/* Action Bar */}
            <div className="d-flex justify-content-between align-items-center pt-2">
              <button
                type="button"
                className="btn-minimal btn-minimal-danger btn-minimal-sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Post
              </button>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn-minimal btn-minimal-secondary"
                  onClick={() => navigate(-1)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-minimal btn-minimal-primary"
                  disabled={isLoading || !title.trim() || !content.trim()}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Form>
        </Card>
      </main>
    </div>
  );
};

export default EditPost;
