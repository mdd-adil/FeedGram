import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form } from 'react-bootstrap';

const CreatePost = () => {
  const navigate = useNavigate();
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
    
    // Simulate post creation
    setTimeout(() => {
      alert('Your post has been created successfully!');
      navigate('/home');
    }, 1000);
  };

  const handleCancel = () => {
    navigate('/home');
  };

  return (
    <div className="h-full" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
              <Card className="shadow-lg">
                <Card.Header className="text-white text-center py-4" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <h2 className="mb-0">Create New Post</h2>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleSubmit}>
                    {/* Caption Input */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        What's on your mind?
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Share your thoughts..."
                        required
                      />
                    </Form.Group>

                    {/* Image Upload */}
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold">
                        Add Photo
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
                    </div>
                  </Form.Group>

                  {/* Image URL Input */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">
                      Or Add Image URL
                    </Form.Label>
                    <Form.Control
                      type="url"
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </Form.Group>

                  {/* Post Settings */}
                  {/* <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Post Settings</Form.Label>
                    <div className="bg-light p-3 rounded">
                      <div className="form-check mb-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="allowComments"
                          defaultChecked
                        />
                        <label className="form-check-label" htmlFor="allowComments">
                          Allow comments
                        </label>
                      </div>
                      <div className="form-check mb-2">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="allowSharing"
                          defaultChecked
                        />
                        <label className="form-check-label" htmlFor="allowSharing">
                          Allow sharing
                        </label>
                      </div>
                    </div>
                  </Form.Group> */}

                  {/* Visibility */}
                  {/* <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">
                      Who can see this post?
                    </Form.Label>
                    <Form.Select id="visibility">
                      <option value="public">Public</option>
                      <option value="friends">Friends Only</option>
                      <option value="private">Only Me</option>
                    </Form.Select>
                  </Form.Group> */}

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
                      disabled={isLoading || !caption}
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