import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bsai_access_token');
    if (token) {
      AuthAPI.getMe()
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('bsai_access_token');
          localStorage.removeItem('bsai_refresh_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await AuthAPI.login({ email, password });
    if (res.data.success) {
      localStorage.setItem('bsai_access_token', res.data.tokens.accessToken);
      localStorage.setItem('bsai_refresh_token', res.data.tokens.refreshToken);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('bsai_access_token');
    localStorage.removeItem('bsai_refresh_token');
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasRole,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
        isInvestigator: user?.role === 'INVESTIGATOR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
        isAuditor: user?.role === 'AUDITOR' || user?.role === 'SUPER_ADMIN',
        isAnalyst: user?.role === 'ANALYST' || user?.role === 'SUPER_ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

