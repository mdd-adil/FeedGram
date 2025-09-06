import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const Chat = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get current user info
  const getCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userId = getCurrentUser();
    setCurrentUser(userId);

    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Authenticate with server
    newSocket.emit('authenticate', token);

    // Handle authentication success
    newSocket.on('authSuccess', (data) => {
      console.log('Authentication successful:', data);
      setIsAuthenticated(true);
    });

    // Handle authentication errors
    newSocket.on('authError', (error) => {
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
      navigate('/login');
    });

    // Handle message errors
    newSocket.on('messageError', (error) => {
      console.error('Message error:', error);
      alert('Failed to send message: ' + error);
    });

    // Listen for new messages
    newSocket.on('newMessage', (message) => {
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const messageExists = prev.some(msg => 
          msg._id === message._id || 
          (msg.message === message.message && 
           msg.sender._id === message.sender._id && 
           Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000)
        );
        
        if (messageExists) {
          return prev;
        }
        
        return [...prev, message];
      });
      
      // Refresh user list to update last message and unread count
      // Only refresh if the message is for/from current user
      if (message.sender._id === currentUser || message.receiver._id === currentUser) {
        fetchUsers();
      }
    });

    // Listen for typing indicators
    newSocket.on('userTyping', (data) => {
      if (data.userId !== userId) {
        setTypingUser(data.isTyping ? data.userId : null);
      }
    });

    // Fetch list of users
    fetchUsers();

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/chat/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchChatHistory = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/chat/history/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessages(response.data.messages);
      
      // Mark messages as read
      await axios.put(`http://localhost:5000/chat/read/${userId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const selectUser = async (user) => {
    setSelectedUser(user);
    setMessages([]);
    await fetchChatHistory(user._id);
    
    // Refresh user list to update unread count after marking messages as read
    fetchUsers();
    
    // Join chat room only if authenticated
    if (socket && isAuthenticated) {
      const chatId = [currentUser, user._id].sort().join('_');
      socket.emit('joinChat', chatId);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedUser && socket && isAuthenticated) {
      socket.emit('sendMessage', {
        receiverId: selectedUser._id,
        message: newMessage.trim()
      });
      setNewMessage('');
      
      // Stop typing indicator
      socket.emit('typing', {
        receiverId: selectedUser._id,
        isTyping: false
      });
    } else if (!isAuthenticated) {
      alert('Please wait for authentication to complete');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (selectedUser && socket && isAuthenticated) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', {
          receiverId: selectedUser._id,
          isTyping: true
        });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', {
          receiverId: selectedUser._id,
          isTyping: false
        });
      }, 1000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAvatarSrc = (user) => {
    if (user?.avatar) {
      return user.avatar;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.username || 'User')}`;
  };

    const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMs = now - messageTime;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      // Today - show time
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // This week - show day name
      return messageTime.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px"
    }}>
      <Container fluid>
        <Row className="h-100">
          {/* Sidebar - Users List */}
          <Col md={4} lg={3} className="pe-0">
            <Card className="h-100 shadow-lg border-0" style={{ borderRadius: "15px" }}>
              <Card.Header className="text-white py-3" style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "15px 15px 0 0"
              }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Messages</h5>
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    onClick={() => navigate('/home')}
                  >
                    Back
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {isLoadingUsers ? (
                  <div className="text-center p-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading conversations...</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-muted">No users available to chat with</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                  {users.map(user => (
                    <ListGroup.Item
                      key={user._id}
                      action
                      active={selectedUser?._id === user._id}
                      onClick={() => selectUser(user)}
                      className="d-flex align-items-center p-3"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="position-relative">
                        <Image
                          src={getAvatarSrc(user)}
                          roundedCircle
                          style={{ 
                            width: "50px", 
                            height: "50px",
                            objectFit: "cover"
                          }}
                        />
                        {user.unreadCount > 0 && (
                          <Badge 
                            bg="danger" 
                            pill 
                            className="position-absolute top-0 start-100 translate-middle"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {user.unreadCount > 99 ? '99+' : user.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-grow-1 ms-3 overflow-hidden">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="fw-bold text-truncate">{user.username}</div>
                          {user.lastMessage && (
                            <small className="text-muted flex-shrink-0 ms-2">
                              {formatTime(user.lastMessage.timestamp)}
                            </small>
                          )}
                        </div>
                        <div className="text-muted small text-truncate">
                          {user.lastMessage ? (
                            <>
                              {user.lastMessage.senderId === currentUser ? 'You: ' : ''}
                              {user.lastMessage.message}
                            </>
                          ) : (
                            'Start a conversation'
                          )}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Chat Area */}
          <Col md={8} lg={9} className="ps-2">
            <Card className="h-100 shadow-lg border-0" style={{ borderRadius: "15px" }}>
              {selectedUser ? (
                <>
                  {/* Chat Header */}
                  <Card.Header className="text-white py-3" style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "15px 15px 0 0"
                  }}>
                    <div className="d-flex align-items-center">
                      <Image
                        src={getAvatarSrc(selectedUser)}
                        roundedCircle
                        style={{ 
                          width: "40px", 
                          height: "40px",
                          marginRight: "12px",
                          objectFit: "cover"
                        }}
                      />
                      <div>
                        <h6 className="mb-0">{selectedUser.username}</h6>
                        {typingUser === selectedUser._id && (
                          <small className="text-light">Typing...</small>
                        )}
                      </div>
                    </div>
                  </Card.Header>

                  {/* Messages Area */}
                  <Card.Body 
                    style={{ 
                      height: '60vh', 
                      overflowY: 'auto',
                      padding: '20px'
                    }}
                  >
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`d-flex mb-3 ${
                          message.sender._id === currentUser ? 'justify-content-end' : 'justify-content-start'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-3 max-width-75 ${
                            message.sender._id === currentUser
                              ? 'bg-primary text-white'
                              : 'bg-light text-dark'
                          }`}
                          style={{ maxWidth: '75%' }}
                        >
                          <div>{message.message}</div>
                          <small 
                            className={`d-block mt-1 ${
                              message.sender._id === currentUser ? 'text-white-50' : 'text-muted'
                            }`}
                          >
                            {formatMessageTime(message.timestamp)}
                          </small>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </Card.Body>

                  {/* Message Input */}
                  <Card.Footer className="bg-light" style={{ borderRadius: "0 0 15px 15px" }}>
                    <Form onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                      <div className="d-flex">
                        <Form.Control
                          type="text"
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={handleTyping}
                          style={{ borderRadius: "25px", marginRight: "10px" }}
                        />
                        <Button
                          type="submit"
                          style={{ 
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                            borderRadius: "50%",
                            width: "50px",
                            height: "50px"
                          }}
                          disabled={!newMessage.trim()}
                        >
                          📤
                        </Button>
                      </div>
                    </Form>
                  </Card.Footer>
                </>
              ) : (
                <Card.Body className="d-flex align-items-center justify-content-center">
                  <div className="text-center text-muted">
                    <h5>Select a user to start chatting</h5>
                    <p>Choose someone from the list to begin your conversation</p>
                  </div>
                </Card.Body>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Chat;
