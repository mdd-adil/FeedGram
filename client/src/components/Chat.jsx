import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Form, ListGroup, Badge, Image, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { isTokenValid, getToken } from '../utils/auth';

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: paramUserId } = useParams();
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
  const [isSelectingUser, setIsSelectingUser] = useState(false);
  const [showTemporaryUserNotice, setShowTemporaryUserNotice] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const getCurrentUser = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const refreshUserList = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/chat/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/chat/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchChatHistory = useCallback(async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/chat/history/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);

      await axios.put(`${API_BASE_URL}/chat/read/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      refreshUserList();
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  }, [refreshUserList]);

  const selectUser = useCallback(async (user) => {
    setSelectedUser(user);
    setMessages([]);

    if (user.isTemporary || (!user.isFollowing && !user.chatHistory)) {
      setShowTemporaryUserNotice(true);
    } else {
      setShowTemporaryUserNotice(false);
    }

    await fetchChatHistory(user._id);

    if (socket && isAuthenticated && currentUser) {
      const chatId = [currentUser, user._id].sort().join('_');
      socket.emit('joinChat', chatId);
    }
  }, [fetchChatHistory, socket, isAuthenticated, currentUser]);

  useEffect(() => {
    if (!isTokenValid()) {
      navigate('/login');
      return;
    }

    const token = getToken();
    const userId = getCurrentUser();
    setCurrentUser(userId);

    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      forceNew: false
    });
    setSocket(newSocket);

    newSocket.emit('authenticate', token);

    newSocket.on('authSuccess', () => {
      setIsAuthenticated(true);
    });

    newSocket.on('authError', (error) => {
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
      navigate('/login');
    });

    newSocket.on('disconnect', () => {
      setIsAuthenticated(false);
    });

    newSocket.on('newMessage', (message) => {
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) =>
            !(
              msg.isOptimistic &&
              msg.message === message.message &&
              msg.sender?._id === message.sender?._id
            )
        );
        if (filtered.some((m) => m._id === message._id)) return prev;
        return [...filtered, message];
      });

      if (message.sender?._id === userId || message.receiver?._id === userId) {
        setTimeout(() => refreshUserList(), 150);
      }
    });

    newSocket.on('userTyping', (data) => {
      if (data.userId !== userId) {
        setTypingUser(data.isTyping ? data.userId : null);
      }
    });

    fetchUsers();

    return () => {
      newSocket.disconnect();
    };
  }, [navigate, getCurrentUser, fetchUsers, refreshUserList]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle direct messaging from URL params or route param
  useEffect(() => {
    const handleDirectMessage = async () => {
      if (isSelectingUser) return;
      const urlParams = new URLSearchParams(location.search);
      const queryUserId = urlParams.get('userId');
      const directMessageUserId = paramUserId || queryUserId;

      if (directMessageUserId && !selectedUser) {
        let userToMessage = users.find((u) => u._id === directMessageUserId);

        if (!userToMessage) {
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/chat/user/${directMessageUserId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            userToMessage = res.data.user;
            if (userToMessage) userToMessage.isTemporary = true;
          } catch (err) {
            console.error('Error fetching direct message user:', err);
            return;
          }
        }

        if (userToMessage) {
          setIsSelectingUser(true);
          selectUser(userToMessage).finally(() => {
            setIsSelectingUser(false);
            if (queryUserId) {
              navigate('/chat', { replace: true });
            }
          });
        }
      }
    };

    handleDirectMessage();
  }, [users, location.search, paramUserId, selectedUser, isSelectingUser, navigate, selectUser]);

  const sendMessage = useCallback(() => {
    if (newMessage.trim() && selectedUser && socket && isAuthenticated && currentUser) {
      const messageText = newMessage.trim();
      const tempId = Date.now().toString();

      const optimisticMessage = {
        _id: tempId,
        message: messageText,
        sender: { _id: currentUser },
        receiver: { _id: selectedUser._id },
        timestamp: new Date().toISOString(),
        isOptimistic: true
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage('');

      socket.emit('sendMessage', {
        receiverId: selectedUser._id,
        message: messageText
      });

      socket.emit('typing', {
        receiverId: selectedUser._id,
        isTyping: false
      });
    }
  }, [newMessage, selectedUser, socket, isAuthenticated, currentUser]);

  const handleTyping = useCallback(
    (e) => {
      setNewMessage(e.target.value);

      if (selectedUser && socket && isAuthenticated) {
        if (!isTyping) {
          setIsTyping(true);
          socket.emit('typing', {
            receiverId: selectedUser._id,
            isTyping: true
          });
        }

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          socket.emit('typing', {
            receiverId: selectedUser._id,
            isTyping: false
          });
        }, 1000);
      }
    },
    [selectedUser, socket, isAuthenticated, isTyping]
  );

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMs = now - messageTime;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return messageTime.toLocaleDateString([], { weekday: 'short' });
    }
    return messageTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, []);

  const getAvatarSrc = useCallback((user) => {
    if (user?.avatar) return user.avatar;
    const username = user?.username || 'User';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
  }, []);

  const formatMessageTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const MessageList = useMemo(() => {
    return messages.map((message, index) => {
      const isSender = message.sender?._id === currentUser;
      return (
        <div
          key={message._id || index}
          className={`d-flex mb-2 ${isSender ? 'justify-content-end' : 'justify-content-start'}`}
        >
          <div className={isSender ? 'chat-bubble-sender' : 'chat-bubble-receiver'}>
            <div>{message.message}</div>
            <small
              className="d-block mt-1"
              style={{
                fontSize: '0.7rem',
                opacity: 0.75,
                textAlign: isSender ? 'right' : 'left'
              }}
            >
              {formatMessageTime(message.timestamp)}
            </small>
          </div>
        </div>
      );
    });
  }, [messages, currentUser, formatMessageTime]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    });
  }, [users]);

  return (
    <div className="app-container">
      {/* Minimal Header */}
      <header className="navbar-minimal">
        <Container className="d-flex align-items-center justify-content-between">
          <div
            className="brand-title cursor-pointer"
            onClick={() => navigate('/home')}
          >
            <span className="brand-dot"></span>
            <span>FeedGram</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn-minimal btn-minimal-secondary btn-minimal-sm"
              onClick={() => navigate('/home')}
            >
              ← Back to Feed
            </button>
          </div>
        </Container>
      </header>

      {/* Main Chat Area */}
      <main className="container py-3" style={{ maxWidth: '1000px' }}>
        <div className="chat-window">
          <Row className="g-0 h-100">
            {/* Sidebar User List */}
            <Col md={5} lg={4} className="chat-sidebar">
              <div
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}
              >
                Conversations
              </div>

              <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                {isLoadingUsers ? (
                  <div className="text-center p-4">
                    <Spinner animation="border" size="sm" variant="dark" />
                    <p
                      className="mt-2 mb-0"
                      style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}
                    >
                      Loading conversations...
                    </p>
                  </div>
                ) : sortedUsers.length === 0 ? (
                  <div className="text-center p-4">
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No conversations yet
                    </p>
                    <small style={{ color: 'var(--text-subtle)', fontSize: '0.8rem' }}>
                      Message someone from their profile or a feed post!
                    </small>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {sortedUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => selectUser(user)}
                        className={`chat-user-item ${selectedUser?._id === user._id ? 'active' : ''}`}
                      >
                        <div className="position-relative">
                          <Image
                            src={getAvatarSrc(user)}
                            roundedCircle
                            style={{
                              width: '42px',
                              height: '42px',
                              objectFit: 'cover',
                              border: '1px solid var(--border-subtle)'
                            }}
                          />
                          {user.unreadCount > 0 && (
                            <Badge
                              bg="danger"
                              pill
                              className="position-absolute top-0 start-100 translate-middle"
                              style={{ fontSize: '0.65rem' }}
                            >
                              {user.unreadCount > 99 ? '99+' : user.unreadCount}
                            </Badge>
                          )}
                        </div>

                        <div className="flex-grow-1 overflow-hidden">
                          <div className="d-flex justify-content-between align-items-baseline">
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: 'var(--text-primary)'
                              }}
                              className="text-truncate"
                            >
                              {user.username}
                            </span>
                            {user.lastMessage && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  flexShrink: 0,
                                  marginLeft: '4px'
                                }}
                              >
                                {formatTime(user.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {user.lastMessage ? (
                              <>
                                {user.lastMessage.senderId === currentUser ? 'You: ' : ''}
                                {user.lastMessage.message}
                              </>
                            ) : (
                              'Start chatting'
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ListGroup>
                )}
              </div>
            </Col>

            {/* Conversation Messages View */}
            <Col md={7} lg={8} className="d-flex flex-column h-100">
              {selectedUser ? (
                <>
                  {/* Active Chat Header */}
                  <div
                    className="d-flex align-items-center justify-content-between"
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div
                      className="d-flex align-items-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/user/${selectedUser._id}`)}
                    >
                      <Image
                        src={getAvatarSrc(selectedUser)}
                        roundedCircle
                        style={{
                          width: '38px',
                          height: '38px',
                          objectFit: 'cover',
                          border: '1px solid var(--border-subtle)'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>
                          {selectedUser.username}
                        </div>
                        {typingUser === selectedUser._id ? (
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            typing...
                          </small>
                        ) : (
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {selectedUser.isFollowing ? 'Following' : 'Active'}
                          </small>
                        )}
                      </div>
                    </div>

                    <button
                      className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                      onClick={() => navigate(`/user/${selectedUser._id}`)}
                    >
                      View Profile
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <div
                    style={{
                      flexGrow: 1,
                      overflowY: 'auto',
                      padding: '1.25rem',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    {showTemporaryUserNotice && (
                      <div
                        style={{
                          fontSize: '0.8rem',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.65rem 0.9rem',
                          marginBottom: '1rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        ℹ️ You are chatting with someone you don't follow yet.
                      </div>
                    )}

                    {MessageList}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Footer */}
                  <div
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderTop: '1px solid var(--border-subtle)',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <Form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="d-flex gap-2"
                    >
                      <Form.Control
                        type="text"
                        placeholder="Write a message..."
                        value={newMessage}
                        onChange={handleTyping}
                        style={{
                          borderRadius: 'var(--radius-full)',
                          padding: '0.55rem 1.15rem'
                        }}
                      />
                      <button
                        type="submit"
                        className="btn-minimal btn-minimal-primary"
                        disabled={!newMessage.trim()}
                        style={{ padding: '0.55rem 1.25rem' }}
                      >
                        Send
                      </button>
                    </Form>
                  </div>
                </>
              ) : (
                <div className="h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Your Messages</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    Select an existing conversation or message someone directly.
                  </p>
                </div>
              )}
            </Col>
          </Row>
        </div>
      </main>
    </div>
  );
};

export default Chat;
