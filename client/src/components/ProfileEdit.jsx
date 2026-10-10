import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Image, Alert, Spinner, Modal } from "react-bootstrap";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: "Bearer " + token },
          withCredentials: true
        });

        const userData = response.data.user || {};
        setFormData({
          username: userData.username || "",
          email: userData.email || "",
          avatar: userData.avatar || ""
        });
        setAvatarPreview(
          userData.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.username || "avatar")}`
        );
      } catch (err) {
        console.error("Failed to fetch profile:", err);
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
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        return;
      }
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
      setError("");
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
      formDataToSend.append("username", formData.username.trim());
      formDataToSend.append("email", formData.email.trim());

      if (selectedFile) {
        formDataToSend.append("avatar", selectedFile);
      }

      await axios.put(`${API_BASE_URL}/updateProfile`, formDataToSend, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true
      });

      // Clear home user cache
      sessionStorage.removeItem("home_user_cache");
      setSuccess("Profile updated successfully");
      setTimeout(() => navigate("/profile"), 1000);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/delete-account`, {
        headers: { Authorization: 'Bearer ' + token },
        withCredentials: true
      });
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiration');
      sessionStorage.clear();
      navigate('/signup');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="dark" />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Delete Account Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        size="sm"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>Delete Account</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Are you sure you want to permanently delete your account? All your posts and data will be erased.
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
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Forever'}
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
              Edit Profile
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
              Update your account credentials and avatar
            </p>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Form onSubmit={handleSubmit}>
            {/* Avatar Picker */}
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                <Image
                  src={avatarPreview}
                  roundedCircle
                  style={{
                    width: '96px',
                    height: '96px',
                    objectFit: 'cover',
                    border: '2px solid var(--border-subtle)'
                  }}
                  alt="Profile Avatar"
                />
                <label
                  htmlFor="avatar-upload"
                  className="btn-minimal btn-minimal-secondary btn-minimal-sm position-absolute"
                  style={{
                    bottom: '-6px',
                    right: '-6px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Change
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
              <small className="text-muted d-block mt-2">
                Click change to upload photo (Max 5MB)
              </small>
            </div>

            <Row>
              <Col xs={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>

              <Col xs={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Actions */}
            <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-3">
              <button
                type="button"
                className="btn-minimal btn-minimal-danger btn-minimal-sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account
              </button>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn-minimal btn-minimal-secondary"
                  onClick={() => navigate(-1)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-minimal btn-minimal-primary"
                  disabled={saving || !formData.username.trim() || !formData.email.trim()}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Form>
        </Card>
      </main>
    </div>
  );
};

export default ProfileEdit;
