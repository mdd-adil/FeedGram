import { useEffect, useState } from "react";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';



const Login = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    
    e.preventDefault();
    try {
      // Send the form data to the backend API
      const response = await axios.post('http://localhost:5000/login',{"email":email,"password":password});
      // setError(response.data.message);
      // Store the JWT token, typically in localStorage or a cookielocal
      // console.log(response.data)
      
      localStorage.setItem("token",response.data.token)
      
      navigate('/home')
    } catch (error) {
      // setMessage(error.response.data.message || 'Login failed.');
    
      setError(error.message)
      console.error('Login error:', error);
    }
    

    // Simulate API call
   
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
            <Card className="shadow-lg border-0" style={{ borderRadius: "15px" }}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold" style={{ color: "#667eea" }}>Welcome Back!</h2>
                  <p className="text-muted">Please sign in to your account</p>
                </div>

                {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Email Address</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="py-2"
                      style={{ borderRadius: "10px" }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="py-2"
                      style={{ borderRadius: "10px" }}
                    />
                  </Form.Group>

                  {/* <Form.Group className="mb-4">
                    <Form.Check 
                      type="checkbox"
                      label="Remember me"
                      className="text-muted"
                    />
                  </Form.Group> */}

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
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  {/* <div className="text-center">
                    <Link to="/forgot-password" className="text-decoration-none" style={{ color: "#764ba2" }}>
                      Forgot Password?
                    </Link>
                  </div> */}
                </Form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="text-muted mb-0">
                    Don't have an account?{" "}
                    <Link to="/signup" className="fw-semibold text-decoration-none" style={{ color: "#667eea" }}>
                      Sign Up
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Login;