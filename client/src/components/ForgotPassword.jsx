import { useState } from "react";
import { Form, Alert, Spinner } from "react-bootstrap";
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
    if (!email.trim()) return;

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
        email: email.trim()
      });

      setMessage(response.data?.message || 'Password reset link sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process request. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-title justify-content-center mb-3">
            <span className="brand-dot"></span>
            <span>FeedGram</span>
          </div>
          <h1>Reset Password</h1>
          <p>Enter your email to receive recovery instructions</p>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </Form.Group>

          <button
            type="submit"
            className="btn-minimal btn-minimal-primary w-100 py-2 mt-2 mb-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Sending Link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              style={{
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                textDecoration: "none"
              }}
            >
              ← Back to Sign In
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPassword;
