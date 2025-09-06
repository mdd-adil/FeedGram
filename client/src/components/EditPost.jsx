import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const EditPost = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [originalPost, setOriginalPost] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get(`http://localhost:5000/updatePost/${postId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const post = response.data.post;
        setOriginalPost(post);
        setTitle(post.title);
        setContent(post.content);
        setImagePreview(post.image);
      } catch (error) {
        console.error('Error fetching post:', error);
        setError(error.response?.data?.message || 'Failed to load post');
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.response?.status === 403) {
          navigate('/home');
        }
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
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
      formData.append('title', title);
      formData.append('content', content);
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      await axios.put(`http://localhost:5000/updatePost/${postId}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Post updated successfully!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/home');
      }, 1500);

    } catch (error) {
      console.error('Error updating post:', error);
      setError(error.response?.data?.message || 'Failed to update post');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/deletePost/${postId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setSuccess('Post deleted successfully!');
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } catch (error) {
        console.error('Error deleting post:', error);
        setError(error.response?.data?.message || 'Failed to delete post');
      }
    }
  };

  if (!originalPost && !error) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <Card className="shadow-lg">
              <Card.Header className="text-white text-center py-4 d-flex justify-content-between align-items-center" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <h2 className="mb-0">Edit Post</h2>
                <Button variant="light" onClick={handleCancel}>❌</Button>
              </Card.Header>
              <Card.Body className="p-4">
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  {/* Title Input */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">
                      Post Title
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter post title..."
                      required
                    />
                  </Form.Group>

                  {/* Content Input */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">
                      Post Content
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Share your thoughts..."
                      required
                    />
                  </Form.Group>

                  {/* Image Upload */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">
                      Change Photo
                    </Form.Label>
                    <div className="d-flex flex-column align-items-center">
                      {imagePreview && (
                        <div className="mb-3 w-100">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="img-fluid rounded"
                            style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="form-control"
                      />
                      <small className="text-muted mt-1">Max file size: 5MB</small>
                    </div>
                  </Form.Group>

                  {/* Action Buttons */}
                  <div className="d-flex gap-3 justify-content-between">
                    <Button
                      variant="danger"
                      onClick={handleDelete}
                      type="button"
                      disabled={isLoading}
                    >
                      Delete Post
                    </Button>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-secondary"
                        onClick={handleCancel}
                        type="button"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading || !title || !content}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none'
                        }}
                      >
                        {isLoading ? 'Updating...' : 'Update Post'}
                      </Button>
                    </div>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPost;
