import { useState } from "react";
import { Form, Alert, InputGroup, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { setTokenWithExpiration } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        identifier: identifier.trim(),
        password
      });

      if (response?.data?.token) {
        setTokenWithExpiration(response.data.token);
        navigate('/home');
      } else {
        setError('Invalid response from server. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', err);
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
          <h1>Welcome back</h1>
          <p>Sign in with your email or phone number</p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Email or Phone Number</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. name@example.com or +1234567890"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <Form.Label className="mb-0">Password</Form.Label>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  textDecoration: "none"
                }}
              >
                Forgot?
              </Link>
            </div>
            <InputGroup className="mt-1">
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-minimal btn-minimal-secondary"
                style={{
                  borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                  borderLeft: "none",
                  padding: "0 0.85rem",
                  fontSize: "0.85rem"
                }}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </InputGroup>
          </Form.Group>

          <button
            type="submit"
            className="btn-minimal btn-minimal-primary w-100 py-2 mt-2 mb-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="text-center pt-2">
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
              Don't have an account?{" "}
            </span>
            <Link
              to="/signup"
              style={{
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Sign Up
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;