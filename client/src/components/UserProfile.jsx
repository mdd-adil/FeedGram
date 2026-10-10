import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Image, Nav, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Post from './Post';
import { API_BASE_URL } from '../config/api';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequestSent, setFollowRequestSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const getCurrentUserId = useCallback(() => {
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

  const currentUserId = getCurrentUserId();

  const showToast = (msg) => {
    setNotification(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const fetchFollowersAndFollowing = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [followersRes, followingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/follow/followers/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/follow/following/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setFollowers(followersRes.data.followers || []);
      setFollowing(followingRes.data.following || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setFollowers([]);
        setFollowing([]);
      }
    }
  }, [userId]);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const profileResponse = await axios.get(`${API_BASE_URL}/user-profile/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const userData = profileResponse.data.user || {};
      setUser(userData);

      if (!userData.isPrivate || profileResponse.data.canViewPosts) {
        setPosts(profileResponse.data.posts || []);
      }

      setIsFollowing(!!profileResponse.data.isFollowing);
      setFollowRequestSent(!!profileResponse.data.followRequestSent);

      if (!userData.isPrivate || profileResponse.data.canViewPosts || profileResponse.data.isFollowing) {
        await fetchFollowersAndFollowing();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  }, [userId, fetchFollowersAndFollowing]);

  useEffect(() => {
    if (!userId) return;
    if (userId === currentUserId) {
      navigate('/profile');
      return;
    }
    setError('');
    fetchUserProfile();
  }, [userId, currentUserId, navigate, fetchUserProfile]);

  useEffect(() => {
    if (user._id && (activeTab === 'followers' || activeTab === 'following')) {
      if (!user.isPrivate || isFollowing) {
        fetchFollowersAndFollowing();
      }
    }
  }, [activeTab, user._id, user.isPrivate, isFollowing, fetchFollowersAndFollowing]);

  const handleFollowToggle = async () => {
    if (followLoading) return;
    setFollowLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (isFollowing) {
        // Unfollow
        await axios.delete(`${API_BASE_URL}/follow/unfollow/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsFollowing(false);
        setUser((prev) => ({
          ...prev,
          followersCount: Math.max(0, (prev.followersCount || 0) - 1)
        }));
        showToast('Unfollowed user');
        await fetchFollowersAndFollowing();
      } else {
        // Follow
        await axios.post(`${API_BASE_URL}/follow/follow/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (user.isPrivate) {
          setFollowRequestSent(true);
          showToast('Follow request sent');
        } else {
          setIsFollowing(true);
          setUser((prev) => ({
            ...prev,
            followersCount: (prev.followersCount || 0) + 1
          }));
          showToast('Following user');
          await fetchFollowersAndFollowing();
        }
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
      showToast('Error updating follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="dark" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container d-flex flex-column align-items-center justify-content-center">
        <p className="text-danger mb-3">{error}</p>
        <button
          className="btn-minimal btn-minimal-primary"
          onClick={() => navigate('/home')}
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const canViewContent = !user.isPrivate || isFollowing;

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {showNotification && (
        <Alert
          variant="dark"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-dropdown)',
            fontSize: '0.875rem'
          }}
          dismissible
          onClose={() => setShowNotification(false)}
        >
          {notification}
        </Alert>
      )}

      {/* Top Bar */}
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
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
            <button
              className="btn-minimal btn-minimal-secondary btn-minimal-sm"
              onClick={() => navigate('/home')}
            >
              Feed
            </button>
          </div>
        </Container>
      </header>

      {/* Profile Container */}
      <main className="container py-4" style={{ maxWidth: '860px' }}>
        <section className="profile-card">
          <Row className="align-items-center">
            <Col xs={12} sm={3} className="text-center mb-3 mb-sm-0">
              <Image
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    user.username || 'User'
                  )}`
                }
                roundedCircle
                className="profile-avatar-large"
                alt={user.username}
              />
            </Col>

            <Col xs={12} sm={9}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h2
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      margin: 0,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {user.username}
                  </h2>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)',
                      margin: 0
                    }}
                  >
                    {user.email}
                  </p>
                  {user.isPrivate && (
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        marginTop: '4px'
                      }}
                    >
                      🔒 Private Account
                    </span>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    className={`btn-minimal btn-minimal-sm ${
                      isFollowing ? 'btn-minimal-secondary' : 'btn-minimal-primary'
                    }`}
                    onClick={handleFollowToggle}
                    disabled={followLoading || followRequestSent}
                  >
                    {followLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : isFollowing ? (
                      'Following'
                    ) : followRequestSent ? (
                      'Requested'
                    ) : (
                      'Follow'
                    )}
                  </button>

                  <button
                    className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                    onClick={() => navigate(`/chat?userId=${userId}`)}
                  >
                    Message
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div
                className="d-flex gap-4 py-2"
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <div className="profile-stat-box p-0 text-start">
                  <div className="profile-stat-num">{posts.length}</div>
                  <div className="profile-stat-label">Posts</div>
                </div>
                <div className="profile-stat-box p-0 text-start">
                  <div className="profile-stat-num">{user.followersCount || 0}</div>
                  <div className="profile-stat-label">Followers</div>
                </div>
                <div className="profile-stat-box p-0 text-start">
                  <div className="profile-stat-num">{user.followingCount || 0}</div>
                  <div className="profile-stat-label">Following</div>
                </div>
              </div>
            </Col>
          </Row>
        </section>

        {/* Content Tabs */}
        {canViewContent ? (
          <>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'posts'}
                  onClick={() => setActiveTab('posts')}
                >
                  Posts ({posts.length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'followers'}
                  onClick={() => setActiveTab('followers')}
                >
                  Followers ({user.followersCount || 0})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'following'}
                  onClick={() => setActiveTab('following')}
                >
                  Following ({user.followingCount || 0})
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {activeTab === 'posts' && (
              posts.length > 0 ? (
                <Row className="g-3">
                  {posts.map((post) => (
                    <Post key={post._id} post={post} />
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <p style={{ color: 'var(--text-muted)' }}>No posts published yet.</p>
                </div>
              )
            )}

            {activeTab === 'followers' && (
              <Row className="g-3">
                {followers.length > 0 ? (
                  followers.map((f) => (
                    <Col key={f._id} md={6}>
                      <div className="minimal-card p-3 d-flex align-items-center justify-content-between mb-0">
                        <div
                          className="d-flex align-items-center gap-2 cursor-pointer"
                          onClick={() => navigate(`/user/${f._id}`)}
                        >
                          <Image
                            src={
                              f.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                f.username
                              )}`
                            }
                            roundedCircle
                            style={{
                              width: '36px',
                              height: '36px',
                              objectFit: 'cover'
                            }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {f.username}
                          </span>
                        </div>
                        <button
                          className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                          onClick={() => navigate(`/user/${f._id}`)}
                        >
                          View
                        </button>
                      </div>
                    </Col>
                  ))
                ) : (
                  <Col xs={12} className="text-center py-5">
                    <p style={{ color: 'var(--text-muted)' }}>No followers yet</p>
                  </Col>
                )}
              </Row>
            )}

            {activeTab === 'following' && (
              <Row className="g-3">
                {following.length > 0 ? (
                  following.map((u) => (
                    <Col key={u._id} md={6}>
                      <div className="minimal-card p-3 d-flex align-items-center justify-content-between mb-0">
                        <div
                          className="d-flex align-items-center gap-2 cursor-pointer"
                          onClick={() => navigate(`/user/${u._id}`)}
                        >
                          <Image
                            src={
                              u.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                u.username
                              )}`
                            }
                            roundedCircle
                            style={{
                              width: '36px',
                              height: '36px',
                              objectFit: 'cover'
                            }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {u.username}
                          </span>
                        </div>
                        <button
                          className="btn-minimal btn-minimal-secondary btn-minimal-sm"
                          onClick={() => navigate(`/user/${u._id}`)}
                        >
                          View
                        </button>
                      </div>
                    </Col>
                  ))
                ) : (
                  <Col xs={12} className="text-center py-5">
                    <p style={{ color: 'var(--text-muted)' }}>Not following anyone</p>
                  </Col>
                )}
              </Row>
            )}
          </>
        ) : (
          <div className="text-center py-5 my-4">
            <span style={{ fontSize: '2rem' }}>🔒</span>
            <h4
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginTop: '0.75rem',
                marginBottom: '0.25rem'
              }}
            >
              This account is private
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Follow this user to view their posts, followers, and following.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
