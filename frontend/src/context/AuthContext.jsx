import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('rental_token');
      const savedUser = localStorage.getItem('rental_user');

      if (savedToken) {
        try {
          // Attempt to verify token and fetch fresh user profile from backend
          const res = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            setToken(savedToken);
            setUser(data.user);
            localStorage.setItem('rental_user', JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            logoutSession();
          }
        } catch (err) {
          console.warn('Backend profile verification failed, using cached session:', err);
          if (savedUser) {
            try {
              setToken(savedToken);
              setUser(JSON.parse(savedUser));
            } catch (e) {
              logoutSession();
            }
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginSession = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('rental_token', newToken);
    localStorage.setItem('rental_user', JSON.stringify(newUser));
  };

  const logoutSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rental_token');
    localStorage.removeItem('rental_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginSession,
        logoutSession,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
