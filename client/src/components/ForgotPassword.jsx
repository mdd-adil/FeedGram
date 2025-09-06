import { useState } from "react";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from 'axios';
import { API_BASE_URL } from "../config/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");
    
    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
        email: email
      });
      
      setMessage(response.data.message);
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
      console.error('Forgot password error:', error);
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
                  <h2 className="fw-bold" style={{ color: "#333" }}>Forgot Password</h2>
                  <p className="text-muted">Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}
                {message && <Alert variant="success">{message}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="py-2"
                      style={{ borderRadius: "10px", border: "2px solid #f0f2f5" }}
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className="w-100 py-2 mb-3 fw-semibold"
                    disabled={isLoading}
                    style={{ 
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                      borderRadius: "10px"
                    }}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
