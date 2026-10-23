import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('mh_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('mh_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('mh_token')));

  useEffect(() => {
    const token = localStorage.getItem('mh_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    let active = true;
    api.get('/auth/me')
      .then(({ data }) => {
        if (!active) return;
        localStorage.setItem('mh_user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch((error) => {
        if (!active) return;
        if ([401, 403].includes(error.response?.status)) {
          localStorage.removeItem('mh_token');
          localStorage.removeItem('mh_user');
        }
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password, rememberMe) => {
    const { data } = await api.post('/auth/login', { email, password, rememberMe });
    const workspaceRoles = ['User', 'Admin', 'Manager', 'Sales Person', 'Accountant', 'Employee'];
    if (data.user?.status !== 'Approved' || !workspaceRoles.includes(data.user.role)) {
      throw new Error('This account is not approved for the ERP dashboard.');
    }
    localStorage.setItem('mh_token', data.token);
    localStorage.setItem('mh_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password, phone) => {
    const { data } = await api.post('/auth/signup', {
      name,
      email,
      password,
      phone,
      role: 'User',
    });
    localStorage.removeItem('mh_token');
    localStorage.removeItem('mh_user');
    setUser(null);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('mh_token');
    localStorage.removeItem('mh_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
