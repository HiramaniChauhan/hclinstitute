
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: any, role: 'student' | 'admin') => Promise<boolean>;
  register: (data: any, role: 'student' | 'admin') => Promise<any>;
  logout: () => void;
  sendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  googleLogin: (credential: string, role: 'student' | 'admin', adminSecret?: string, isSignup?: boolean) => Promise<any>;
  sendAdminSecretOtp: (email: string) => Promise<boolean>;
  updateAdminSecret: (email: string, otp: string, newSecret: string) => Promise<boolean>;
  requestPasswordReset: (email: string, role: string) => Promise<boolean>;
  verifyResetOtp: (email: string, otp: string) => Promise<boolean>;
  resetPassword: (data: any) => Promise<boolean>;
  getProfile: () => Promise<any>;
  updateProfile: (data: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (credentials: any, role: 'student' | 'admin') => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials, role }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);

        if (role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
        return true;
      } else {
        toast.error(data.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Connection error');
      return false;
    }
  };

  const register = async (data: any, role: 'student' | 'admin') => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, role }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.isVerified ? 'Registration successful and Verified!' : 'Registration successful! Waiting for admin verification.');
        return result;
      } else {
        toast.error(result.error || 'Registration failed');
        return null;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Connection error');
      return null;
    }
  };

  const sendOtp = async (email: string) => {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      return response.ok;
    } catch (error) {
      console.error('OTP send error:', error);
      return false;
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      return response.ok;
    } catch (error) {
      console.error('OTP verify error:', error);
      return false;
    }
  };

  const sendAdminSecretOtp = async (email: string) => {
    try {
      const response = await fetch('/api/auth/admin-secret-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to send Admin OTP');
      }
      return response.ok;
    } catch (error) {
      console.error('Admin OTP send error:', error);
      return false;
    }
  };

  const updateAdminSecret = async (email: string, otp: string, newSecret: string) => {
    try {
      const response = await fetch('/api/auth/update-admin-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newSecret }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Admin secret updated successfully');
        return true;
      } else {
        toast.error(data.error || 'Update failed');
        return false;
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Connection error');
      return false;
    }
  };

  const requestPasswordReset = async (email: string, role: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to send OTP');
      }
      return response.ok;
    } catch (error) {
      console.error('Forgot password error:', error);
      return false;
    }
  };

  const verifyResetOtp = async (email: string, otp: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Invalid OTP');
      }
      return response.ok;
    } catch (error) {
      console.error('Verify OTP error:', error);
      return false;
    }
  };

  const resetPassword = async (data: any) => {
    try {
      const response = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success('Password reset successful. Please login.');
        return true;
      } else {
        toast.error(result.error || 'Password reset failed');
        return false;
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Connection error');
      return false;
    }
  };

  const getProfile = useCallback(async () => {
    const token = sessionStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await fetch('/api/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        sessionStorage.setItem('user', JSON.stringify(data));
        return data;
      }
      return null;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (data: any) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        toast.error('Not authenticated');
        return false;
      }

      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        setUser(responseData);
        sessionStorage.setItem('user', JSON.stringify(responseData));
        toast.success(responseData.message || 'Profile updated successfully');
        return true;
      } else {
        toast.error(responseData.error || 'Failed to update profile');
        return false;
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Connection error while updating profile');
      return false;
    }
  }, []);

  const googleLogin = async (credential: string, role: 'student' | 'admin', adminSecret?: string, isSignup?: boolean) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, role, adminSecret, isSignup }),
      });

      const data = await response.json();

      if (response.ok) {
        if (isSignup) {
          return data.user; // Return user info for signup pre-fill
        }
        toast.success(`Welcome back ${data.user.name}!`);
        setUser(data.user);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('token', data.token);
        navigate(role === 'admin' ? '/admin' : '/');
        return true;
      }

      toast.error(data.error || 'Google login failed');
      return false;
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Connection error');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      sendOtp,
      verifyOtp,
      googleLogin,
      sendAdminSecretOtp,
      updateAdminSecret,
      requestPasswordReset,
      verifyResetOtp,
      resetPassword,
      getProfile,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
