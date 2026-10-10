import { useState, useEffect } from "react";
import { Form, Alert, Spinner } from "react-bootstrap";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_BASE_URL } from "../config/api";

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
      setError("Invalid or expired reset token");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/reset-password`, {
        token,
        password,
        confirmPassword
      });

      setMessage(response.data?.message || "Password successfully reset!");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
      console.error('Reset password error:', err);
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
          <h1>Set New Password</h1>
          <p>Please enter your updated password below</p>
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        {message && (
          <Alert variant="success">
            {message}
            <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>
              Redirecting to login shortly...
            </div>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>New Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Form.Group>

          <button
            type="submit"
            className="btn-minimal btn-minimal-primary w-100 py-2 mt-2 mb-3"
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating Password...
              </>
            ) : (
              "Update Password"
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

export default ResetPassword;
