import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  orgId: string;
  token: string;
  name: string;
  email: string;
  role: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  token: null,
  setToken: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load token from localStorage (or cookie, etc.)
    const storedToken = localStorage.getItem('jwt_token');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user profile from backend
      axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then(res => {
          setUser({
            ...res.data,
            token: storedToken,
            orgId: res.data.orgId || res.data.organizationId || '',
            plan: res.data.plan || res.data.subscriptionTier || 'basic',
            role: res.data.role || 'user',
          });
        })
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
