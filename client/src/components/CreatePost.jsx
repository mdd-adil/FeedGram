import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Alert, Spinner, Container } from 'react-bootstrap';
import { API_BASE_URL } from '../config/api';

const CreatePost = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG, JPG, WEBP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be under 5MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    const input = document.getElementById('post-image-input');
    if (input) input.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(`${API_BASE_URL}/createPost`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create post');
      }

      // Invalidate posts cache so feed loads fresh
      sessionStorage.removeItem('home_posts_cache');
      navigate('/home');
    } catch (err) {
      console.error('Create post error:', err);
      setError(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Minimalist Header */}
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

      {/* Main Content */}
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
              New Post
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
              Share your thoughts, experiences, or photography
            </p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a concise title..."
                required
                maxLength={120}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What would you like to share today?"
                required
              />
            </Form.Group>

            {/* Media Upload */}
            <Form.Group className="mb-4">
              <Form.Label>Photo Attachment (Optional)</Form.Label>
              {imagePreview ? (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-subtle)'
                  }}
                >
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    style={{
                      width: '100%',
                      maxHeight: '340px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="btn-icon-minimal position-absolute top-0 end-0 m-2"
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      color: '#ffffff'
                    }}
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    border: '1px dashed var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-subtle)',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('post-image-input').click()}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📷</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Click to browse and upload an image
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    PNG, JPG, or WEBP up to 5MB
                  </div>
                </div>
              )}

              <input
                id="post-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </Form.Group>

            {/* Submit Actions */}
            <div className="d-flex justify-content-end gap-2 pt-2">
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
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Publishing...
                  </>
                ) : (
                  'Publish Post'
                )}
              </button>
            </div>
          </Form>
        </Card>
      </main>
    </div>
  );
};

export default CreatePost;