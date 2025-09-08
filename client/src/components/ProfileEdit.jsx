import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Image, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from '../config/api';

const ProfileEdit = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    avatar: ""
  });

  const [avatarPreview, setAvatarPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch current user data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
            const response = await axios.get(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: "Bearer " + token,
          },
          withCredentials: true
        });

        const userData = response.data.user;
        setFormData({
          username: userData.username || "",
          email: userData.email || "",
          avatar: userData.avatar || ""
        });
        setAvatarPreview(userData.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=avatar");
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
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

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(""); // Clear any previous errors
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      
      if (selectedFile) {
        formDataToSend.append("avatar", selectedFile);
      }

      const response = await axios.put(`${API_BASE_URL}/updateProfile`, formDataToSend, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true
      });

      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        navigate("/profile");
      }, 1500);

    } catch (error) {
      console.error("Profile update error:", error);
      setError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/delete-account`, {
        headers: { Authorization: 'Bearer ' + token },
        withCredentials: true
      });
      localStorage.removeItem('token');
      navigate('/register');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Header */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px 0",
        marginBottom: "30px"
      }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="text-white mb-0 fw-bold">Edit Profile</h2>
            <Button 
              variant="outline-light"
              onClick={handleCancel}
              style={{ borderRadius: "20px" }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </Container>
      </div>

      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" style={{ color: "#667eea" }}>
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3 text-muted">Loading profile data...</p>
              </div>
            ) : (
              <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
                <Card.Body className="p-4">
                  {error && (
                    <Alert variant="danger" dismissible onClose={() => setError("")}>
                      {error}
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert variant="success" dismissible onClose={() => setSuccess("")}>
                      {success}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    {/* Avatar Section */}
                    <div className="text-center mb-4">
                      <div className="position-relative d-inline-block">
                        <Image
                          src={avatarPreview}
                          roundedCircle
                          style={{ 
                            width: "150px", 
                            height: "150px",
                            border: "4px solid #667eea",
                            objectFit: "cover"
                          }}
                          alt="Profile Avatar"
                        />
                        <label 
                          htmlFor="avatar-upload"
                          style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "white",
                            fontSize: "18px",
                            boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
                          }}
                          title="Click to change profile picture"
                        >
                          📷
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{ display: "none" }}
                        />
                      </div>
                      <p className="text-muted mt-2 mb-0">
                        Click camera icon to change photo (Max 5MB)
                      </p>
                      {selectedFile && (
                        <p className="text-success mt-1 mb-0">
                          ✓ New image selected: {selectedFile.name}
                        </p>
                      )}
                    </div>

                    {/* Form Fields */}
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold" style={{ color: "#667eea" }}>
                            Username
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            style={{ borderRadius: "10px", borderColor: "#e0e0e0" }}
                            className="shadow-sm"
                            required
                          />
                          <Form.Text className="text-muted">
                            Your unique @username
                          </Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="fw-semibold" style={{ color: "#667eea" }}>
                            Email
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            style={{ borderRadius: "10px", borderColor: "#e0e0e0" }}
                            className="shadow-sm"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Action Buttons */}
                    <div className="d-flex justify-content-end gap-3 mt-4">
                      <Button
                        variant="outline-secondary"
                        onClick={handleCancel}
                        type="button"
                        style={{ borderRadius: "20px", padding: "10px 30px" }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving || !formData.username.trim() || !formData.email.trim()}
                        style={{
                          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                          border: "none",
                          borderRadius: "20px",
                          padding: "10px 30px"
                        }}
                      >
                        {saving ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </Form>

                  {/* Delete Account Button */}
                  <div className="text-center mt-4">
                    <Button
                      variant="danger"
                      className="mt-3"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ProfileEdit;
