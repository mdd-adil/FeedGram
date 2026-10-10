import { useState } from "react";
import { Form, Alert, InputGroup, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { setTokenWithExpiration } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: email.trim(),
        password: password
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
          <p>Sign in to your account to continue</p>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

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