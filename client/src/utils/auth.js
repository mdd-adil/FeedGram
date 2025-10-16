// Token utility functions for persistent login

export const isTokenValid = () => {
  const token = localStorage.getItem('token');
  const expiration = localStorage.getItem('tokenExpiration');
  
  if (!token || !expiration) {
    return false;
  }
  
  const now = new Date().getTime();
  const expirationTime = parseInt(expiration);
  
  if (now > expirationTime) {
    // Token has expired, remove it
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');
    return false;
  }
  
  return true;
};

export const setTokenWithExpiration = (token) => {
  const expirationTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000); // 30 days
  localStorage.setItem('token', token);
  localStorage.setItem('tokenExpiration', expirationTime.toString());
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiration');
};

export const getToken = () => {
  if (isTokenValid()) {
    return localStorage.getItem('token');
  }
  return null;
};