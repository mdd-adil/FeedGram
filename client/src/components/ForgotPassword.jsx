import { useState, useEffect } from "react";
import { Form, Alert, Spinner, InputGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import { API_BASE_URL } from "../config/api";
import { validateClientPhone, validateClientEmail } from "../utils/validators";

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Step 1: Request WhatsApp OTP, Step 2: Enter WhatsApp OTP & Set New Password
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [targetPhone, setTargetPhone] = useState("");

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

  // Step 1: Send WhatsApp OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const raw = identifier.trim();
    if (!raw) {
      setError("Please enter your registered phone number, email, or username.");
      return;
    }

    // If it's pure email format, validate it
    if (raw.includes('@')) {
      const emailCheck = validateClientEmail(raw);
      if (!emailCheck.isValid) {
        setError(emailCheck.message);
        return;
      }
    } else {
      // If it looks like a phone number, validate phone format
      const digits = raw.replace(/[\s\-()]/g, '');
      if (digits.startsWith('+') || /^\d{8,15}$/.test(digits)) {
        const phoneCheck = validateClientPhone(raw);
        if (!phoneCheck.isValid) {
          setError(phoneCheck.message);
          return;
        }
      }
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password/send-otp`, {
        identifier: raw,
        channel: 'whatsapp'
      });

      const recipient = response.data?.phone || raw;
      setTargetPhone(recipient);
      setMessage(response.data?.message || `WhatsApp verification code sent to ${recipient}`);
      setStep(2);
      setResendCooldown(45);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send WhatsApp reset code. Please check your phone number or account.");
      console.error("Forgot password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify WhatsApp OTP and update password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit WhatsApp verification code.");
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
        channel: 'whatsapp',
        otp: otp.trim(),
        password,
        confirmPassword
      });

      setMessage(response.data?.message || "Password updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please check your WhatsApp code.");
      console.error("Reset password error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend WhatsApp OTP handler
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password/send-otp`, {
        identifier: identifier.trim(),
        channel: 'whatsapp'
      });

      setMessage(response.data?.message || `New WhatsApp code sent!`);
      setResendCooldown(45);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend WhatsApp code.");
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
              <p>Receive a verification code via WhatsApp to reset your password</p>
            </>
          ) : (
            <>
              <h1>Set new password</h1>
              <p>
                Enter the WhatsApp code sent to <strong>{targetPhone || identifier}</strong>
              </p>
            </>
          )}
        </div>

        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        {message && <Alert variant="success" dismissible onClose={() => setMessage("")}>{message}</Alert>}

        {step === 1 ? (
          /* Step 1: Identifier Input Form */
          <Form onSubmit={handleSendOtp}>
            <Form.Group className="mb-3">
              <Form.Label>Phone Number, Email, or Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. +91 9876543210 or your email"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError("");
                }}
                required
                autoComplete="username"
              />
              <Form.Text className="text-muted" style={{ fontSize: "0.75rem" }}>
                Your 6-digit verification code will be sent to your registered WhatsApp phone number.
              </Form.Text>
            </Form.Group>


            <button
              type="submit"
              className="btn-minimal btn-minimal-primary w-100 py-2 mt-2 mb-3"
              disabled={isLoading || !identifier.trim()}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sending WhatsApp Code...
                </>
              ) : (
                "Send WhatsApp Verification Code →"
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
          /* Step 2: WhatsApp OTP & New Password Form */
          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3">
              <Form.Label className="d-block text-center mb-1">
                6-Digit WhatsApp Code
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
                Check your WhatsApp messages for the 6-digit code
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn-minimal btn-minimal-secondary px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
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
                minLength={6}
                autoComplete="new-password"
              />
            </Form.Group>

            <button
              type="submit"
              className="btn-minimal btn-minimal-primary w-100 py-2 mb-3"
              disabled={isLoading || otp.length !== 6 || password.length < 6}
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
                ← Back
              </button>

              <button
                type="button"
                className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend WhatsApp Code"}
              </button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
