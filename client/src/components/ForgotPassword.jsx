import { useState, useEffect } from "react";
import { Form, Alert, Spinner, InputGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_BASE_URL } from "../config/api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Step 1: Request OTP, Step 2: Enter OTP & Set New Password
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState("whatsapp"); // 'whatsapp' or 'email'
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to Phone (WhatsApp) or Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your registered phone number or email address.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password/send-otp`, {
        identifier: identifier.trim(),
        channel
      });

      setMessage(response.data?.message || `Verification code sent via ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}`);
      setStep(2);
      setResendCooldown(45);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code. Please check your phone or email.");
      console.error("Forgot password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and update password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password/reset`, {
        identifier: identifier.trim(),
        channel,
        otp: otp.trim(),
        password,
        confirmPassword
      });

      setMessage(response.data?.message || "Password updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please check your code.");
      console.error("Reset password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password/send-otp`, {
        identifier: identifier.trim(),
        channel
      });

      setMessage(response.data?.message || `New code sent via ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}!`);
      setResendCooldown(45);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code.");
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

          {step === 1 ? (
            <>
              <h1>Reset password</h1>
              <p>Verify via WhatsApp or email to reset your password</p>
            </>
          ) : (
            <>
              <h1>Set new password</h1>
              <p>
                Enter the code sent to <strong>{identifier}</strong>
              </p>
            </>
          )}
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert variant="success" dismissible onClose={() => setMessage("")}>{message}</Alert>}

        {step === 1 ? (
          /* Step 1: Phone or Email Input Form */
          <Form onSubmit={handleSendOtp}>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number or Email</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. +14155552671 or name@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
              <Form.Text className="text-muted" style={{ fontSize: "0.75rem" }}>
                For phone, include country code (e.g. +91 or +1)
              </Form.Text>
            </Form.Group>

            {/* Channel Selection */}
            <Form.Group className="mb-3">
              <Form.Label>Receive OTP via</Form.Label>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className={`btn-minimal w-50 py-2 ${channel === 'whatsapp' ? 'btn-minimal-primary' : 'btn-minimal-secondary'}`}
                  onClick={() => setChannel('whatsapp')}
                >
                  💬 WhatsApp
                </button>
                <button
                  type="button"
                  className={`btn-minimal w-50 py-2 ${channel === 'email' ? 'btn-minimal-primary' : 'btn-minimal-secondary'}`}
                  onClick={() => setChannel('email')}
                >
                  ✉️ Email
                </button>
              </div>
            </Form.Group>

            <button
              type="submit"
              className="btn-minimal btn-minimal-primary w-100 py-2 mt-2 mb-3"
              disabled={isLoading || !identifier.trim()}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sending Code...
                </>
              ) : (
                `Send ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'} Code →`
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
        ) : (
          /* Step 2: OTP & New Password Form */
          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3">
              <Form.Label className="d-block text-center mb-1">
                6-Digit {channel === 'whatsapp' ? 'WhatsApp' : 'Email'} Code
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="••••••"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                className="otp-input-field"
              />
              <Form.Text className="text-muted d-block text-center mt-2" style={{ fontSize: "0.75rem" }}>
                {channel === 'whatsapp'
                  ? 'Check your WhatsApp messages for the verification code'
                  : 'Check your email inbox or spam folder for the code'}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>

            <button
              type="submit"
              className="btn-minimal btn-minimal-primary w-100 py-2 mb-3"
              disabled={isLoading || otp.length !== 6 || !password || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Updating Password...
                </>
              ) : (
                "Verify Code & Reset Password"
              )}
            </button>

            <div className="d-flex justify-content-between align-items-center pt-2">
              <button
                type="button"
                className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                onClick={() => {
                  setStep(1);
                  setError("");
                  setMessage("");
                }}
              >
                ← Change details
              </button>

              <button
                type="button"
                className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
