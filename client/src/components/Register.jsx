import axios from "axios";
import { useState } from "react";
import { Container, Form, Button, Card, Alert, Row, Col } from "react-bootstrap";
import {  Link, useNavigate } from "react-router-dom";
import API_BASE_URL from '../config/api';

const SignUp = () => {
  const navigate = useNavigate();
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username,setUsername]=useState("")
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Send the form data to the backend API
      const response = await axios.post(`${API_BASE_URL}/register`,{"username":username,"password":password,"email":email});
      
      // Store the JWT token, typically in localStorage or a cookie
      // console.log(response.data)
      
      
      
      navigate('/login')
    } catch (error) {
      // setMessage(error.response.data.message || 'Login failed.');
    
      setError(error.message)
      console.error('Login error:', error);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      display: "flex",
      alignItems: "center",
      padding: "20px"
    }}>
      <Container>
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <Card className="shadow-lg border-0" style={{ borderRadius: "15px" }}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold" style={{ color: "#f5576c" }}>Create Account</h2>
                  <p className="text-muted">Join our community today!</p>
                </div>

                {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="username"
                          placeholder="John"
                          value={username}
                          onChange={(e)=>{setUsername(e.target.value)}}
                          required
                          className="py-2"
                          style={{ borderRadius: "10px" }}
                        />
                      </Form.Group>
                    
                   
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e)=>{setEmail(e.target.value)}}
                      required
                      className="py-2"
                      style={{ borderRadius: "10px" }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e)=>{setPassword(e.target.value)}}
                      required
                      className="py-2"
                      style={{ borderRadius: "10px" }}
                    />
                  </Form.Group>

                 
                  

                  <Button
                    type="submit"
                    className="w-100 py-2 mb-3 fw-semibold"
                    disabled={isLoading}
                    style={{ 
                      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                      border: "none",
                      borderRadius: "10px"
                    }}
                  >
                    {isLoading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </Form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="text-muted mb-0">
                    Already have an account?{" "}
                    <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: "#f5576c" }}>
                      Sign In
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

export default SignUp;