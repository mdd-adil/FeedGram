import axios from "axios";
import { useState } from "react";
import { Form, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config/api';

const SignUp = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) return;

    setIsLoading(true);
    setError("");

    try {
      await axios.post(`${API_BASE_URL}/register`, {
        username: username.trim(),
        password: password,
        email: email.trim()
      });

      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
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
          <h1>Create an account</h1>
          <p>Join FeedGram to connect and share</p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. alexander"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </Form.Group>

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

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Create a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Form.Text className="text-muted" style={{ fontSize: "0.75rem" }}>
              Must be at least 6 characters
            </Form.Text>
          </Form.Group>

          <button
            type="submit"
            className="btn-minimal btn-minimal-primary w-100 py-2 mt-2 mb-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>

          <div className="text-center pt-2">
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              style={{
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Sign In
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SignUp;