import { useState } from "react";
import { Container, Row, Col, Card, Button, Form, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const ProfileEdit = () => {
  const navigate = useNavigate();
  
  // Mock initial user data
  const [formData, setFormData] = useState({
    name: "John Doe",
    username: "johndoe",
    bio: "Full Stack Developer | Tech Enthusiast | Coffee Lover ☕",
    email: "john.doe@example.com",
    website: "https://johndoe.dev",
    phone: "+1 (555) 123-4567",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
  });

  const [avatarPreview, setAvatarPreview] = useState(formData.avatar);

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
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Saving profile data:", formData);
    // Navigate back to profile after saving
    navigate("/profile");
  };

  const handleCancel = () => {
    navigate("/profile");
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
            >
              Cancel
            </Button>
          </div>
        </Container>
      </div>

      <Container>
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
              <Card.Body className="p-4">
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
                          fontSize: "20px"
                        }}
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
                    <p className="text-muted mt-2 mb-0">Click camera icon to change photo</p>
                  </div>

                  {/* Form Fields */}
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold" style={{ color: "#667eea" }}>
                          Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          style={{ borderRadius: "10px", borderColor: "#e0e0e0" }}
                          className="shadow-sm"
                        />
                      </Form.Group>
                    </Col>

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
                        />
                        <Form.Text className="text-muted">
                          Your unique @username
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label className="fw-semibold" style={{ color: "#667eea" }}>
                          Bio
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          style={{ borderRadius: "10px", borderColor: "#e0e0e0" }}
                          className="shadow-sm"
                          maxLength={150}
                        />
                        <Form.Text className="text-muted">
                          {150 - formData.bio.length} characters remaining
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
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
                        />
                      </Form.Group>
                    </Col>
                  </Row>

               

                  {/* Privacy Settings */}
                  {/* <Card className="mb-4" style={{ borderRadius: "10px", background: "#f8f3ff" }}>
                    <Card.Body>
                      <h5 className="fw-semibold mb-3" style={{ color: "#764ba2" }}>
                        Privacy Settings
                      </h5>
                      <Form.Check 
                        type="switch"
                        id="private-account"
                        label="Private Account"
                        className="mb-2"
                        style={{ fontSize: "16px" }}
                      />
                      <Form.Text className="text-muted d-block mb-3">
                        When your account is private, only people you approve can see your posts
                      </Form.Text>
                      
                      <Form.Check 
                        type="switch"
                        id="show-activity"
                        label="Show Activity Status"
                        className="mb-2"
                        style={{ fontSize: "16px" }}
                      />
                      <Form.Text className="text-muted d-block">
                        Allow others to see when you were last active
                      </Form.Text>
                    </Card.Body>
                  </Card> */}

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-end gap-3">
                    <Button
                      variant="outline-secondary"
                      onClick={handleCancel}
                      style={{ 
                        borderRadius: "20px",
                        padding: "10px 30px",
                        fontWeight: "600"
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      style={{ 
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                        borderRadius: "20px",
                        padding: "10px 30px",
                        fontWeight: "600"
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {/* Danger Zone */}
            <Card className="mt-4 border-danger" style={{ borderRadius: "15px" }}>
              <Card.Body className="p-4">
                <h5 className="text-danger fw-semibold mb-3">Danger Zone</h5>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 fw-semibold">Delete Account</p>
                    <small className="text-muted">Once deleted, your account cannot be recovered</small>
                  </div>
                  <Button 
                    variant="outline-danger"
                    style={{ borderRadius: "20px" }}
                  >
                    Delete Account
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ProfileEdit;
