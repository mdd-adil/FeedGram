import { useState, useEffect } from "react";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!token) {
      setError("Invalid reset token");
    }
  }, [token]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:5000/reset-password', {
        token: token,
        password: password,
        confirmPassword: confirmPassword
      });
      
      setMessage(response.data.message);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      padding: "20px"
    }}>
      <Container>
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <Card className="shadow-lg border-0" style={{ borderRadius: "20px" }}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold" style={{ color: "#333" }}>Reset Password</h2>
                  <p className="text-muted">Enter your new password below.</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}
                {message && (
                  <Alert variant="success">
                    {message}
                    <br />
                    <small>Redirecting to login page in 3 seconds...</small>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">New Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="py-2"
                      style={{ borderRadius: "10px", border: "2px solid #f0f2f5" }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="py-2"
                      style={{ borderRadius: "10px", border: "2px solid #f0f2f5" }}
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 py-2 mb-3 fw-semibold"
                    disabled={isLoading || !token}
                    style={{ 
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      borderRadius: "10px"
                    }}
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>

                  <div className="text-center">
                    <Link to="/login" className="text-decoration-none" style={{ color: "#764ba2" }}>
                      Back to Login
                    </Link>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ResetPassword;
