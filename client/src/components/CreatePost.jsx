import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Alert } from 'react-bootstrap';
import API_BASE_URL from '../config/api';

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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(''); // Clear any previous errors
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(`${API_BASE_URL}/createPost`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const data = await response.json();
      alert('Your post has been created successfully!');
      navigate('/home');
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="h-full" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
              <Card className="shadow-lg">
                <Card.Header className="text-white align-items-center d-flex justify-content-between py-4" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <h2 className="mb-0">Create New Post</h2>
                  <Button variant="light" onClick={handleCancel}>❌</Button>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleSubmit}>
                    {error && <Alert variant="danger">{error}</Alert>}
                    
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
                        What's on your mind?
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
                        Add Photo (Optional)
                      </Form.Label>
                      <div className="d-flex flex-column align-items-center">
                        {imagePreview && (
                          <div className="mb-3 w-100 position-relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="img-fluid rounded"
                              style={{ maxHeight: '400px', width: '100%', objectFit: 'cover' }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0 m-2"
                              onClick={() => {
                                setSelectedImage(null);
                                setImagePreview('');
                                document.getElementById('image').value = '';
                              }}
                              style={{ borderRadius: "50%" }}
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                        <input
                          type="file"
                          id="image"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="form-control"
                          style={{ borderRadius: "10px" }}
                        />
                        {selectedImage && (
                          <small className="text-success mt-2">
                            ✓ Image selected: {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                          </small>
                        )}
                      </div>
                    </Form.Group>               
                  {/* Action Buttons */}
                  <div className="d-flex gap-3 justify-content-end">
                    <Button
                      variant="outline-secondary"
                      onClick={handleCancel}
                      type="button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !title.trim() || !content.trim()}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none'
                      }}
                    >
                      {isLoading ? 'Posting...' : 'Create Post'}
                    </Button>
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

export default CreatePost;