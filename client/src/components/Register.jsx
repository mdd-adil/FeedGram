import axios from "axios";
import { useState, useEffect } from "react";
import { Form, Alert, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from '../config/api';
import { validateClientEmail, validateClientPhone, formatClientPhone } from '../utils/validators';

const SignUp = () => {
  const navigate = useNavigate();

  // Step 1: details, Step 2: WhatsApp OTP verification
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  // Step 1: Validate and send WhatsApp OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();

    if (!username.trim() || !email.trim() || !phone.trim() || !password) {
      setError("Please fill in all required fields (username, email, phone, and password).");
      return;
    }

    // Client-side email validation
    const emailValidation = validateClientEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.message);
      return;
    }

    // Client-side phone validation
    const phoneValidation = validateClientPhone(phone);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.message);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(`${API_BASE_URL}/register/send-otp`, {
        username: username.trim(),
        email: emailValidation.email,
        phone: phoneValidation.phone
      });

      setSuccess(response.data?.message || `WhatsApp verification code sent to ${phoneValidation.phone}`);
      setStep(2);
      setResendCooldown(45);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send WhatsApp verification code. Please check your phone number.");
      console.error("Send OTP error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit WhatsApp OTP and create account
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the 6-digit WhatsApp verification code.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formattedPhone = formatClientPhone(phone);
      const response = await axios.post(`${API_BASE_URL}/register`, {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone,
        password,
        otp: otp.trim()
      });

      setSuccess(response.data?.message || "Account created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired WhatsApp verification code.");
      console.error("Registration error:", err);
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
      const formattedPhone = formatClientPhone(phone);
      const response = await axios.post(`${API_BASE_URL}/register/send-otp`, {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        phone: formattedPhone
      });

      setSuccess(response.data?.message || `New WhatsApp verification code sent!`);
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
              <h1>Create an account</h1>
              <p>Sign up and verify via WhatsApp OTP</p>
            </>
          ) : (
            <>
              <h1>Verify WhatsApp</h1>
              <p>
                Enter the 6-digit code sent to WhatsApp: <strong>{formatClientPhone(phone)}</strong>
              </p>
            </>
          )}
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {step === 1 ? (
          /* Step 1: User Details Form */
          <Form onSubmit={handleSendOtp}>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                required
                autoComplete="email"
              />
              <Form.Text className="text-muted" style={{ fontSize: "0.75rem" }}>
                Must be a valid email address (e.g. name@example.com)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>WhatsApp Phone Number</Form.Label>
              <Form.Control
                type="tel"
                placeholder="e.g. +91 9876543210 or +1 4155552671"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) setError("");
                }}
                required
                autoComplete="tel"
              />
              <Form.Text className="text-muted" style={{ fontSize: "0.75rem" }}>
                Include country code (e.g. +91 for India, +1 for US). OTP will be sent to WhatsApp.
              </Form.Text>

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
                  Sending WhatsApp OTP...
                </>
              ) : (
                "Send WhatsApp Verification Code →"
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
        ) : (
          /* Step 2: Enter WhatsApp OTP */
          <Form onSubmit={handleVerifyAndRegister}>
            <Form.Group className="mb-4">
              <Form.Label className="d-block text-center mb-2">
                Enter 6-Digit WhatsApp Code
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
              <Form.Text className="text-muted d-block text-center mt-2" style={{ fontSize: "0.8rem" }}>
                Check your WhatsApp messages on {formatClientPhone(phone)} for the code
              </Form.Text>
            </Form.Group>

            <button
              type="submit"
              className="btn-minimal btn-minimal-primary w-100 py-2 mb-3"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Verifying WhatsApp OTP...
                </>
              ) : (
                "Verify & Create Account"
              )}
            </button>

            <div className="d-flex justify-content-between align-items-center pt-2">
              <button
                type="button"
                className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                onClick={() => {
                  setStep(1);
                  setError("");
                  setSuccess("");
                }}
              >
                ← Edit details
              </button>

              <button
                type="button"
                className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend WhatsApp OTP"}
              </button>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
};

export default SignUp;