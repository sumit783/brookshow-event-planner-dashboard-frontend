import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isAuthenticated,
  getUser,
  clearAuth,
  setAuthTokens,
  setUser,
  type User,
  type AuthTokens
} from '@/services/auth';
import { apiClient } from '@/services/apiClient';
import { toast } from '@/hooks/use-toast';

interface SignupData {
  email: string;
  phone: string;
  displayName: string;
  countryCode: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  verifyOtp: (email: string, otp: string, isLogin?: boolean) => Promise<void>;
  logout: () => void;
  resendOtp: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isAuthenticated()) {
          const storedUser = getUser();
          setUserState(storedUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string) => {
    try {
      await apiClient.sendOtp(email);
      toast({
        title: 'OTP Sent',
        description: 'Please check your email for the verification code.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    try {
      await apiClient.signup(data);
      toast({
        title: 'Account Created',
        description: 'Please check your email for the verification code.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const verifyOtp = async (email: string, otp: string, isLogin: boolean = true) => {
    try {
      const response = await apiClient.verifyOtp(email, otp, isLogin);

      // Ensure role is planner
      if (response.user.role !== 'planner') {
        throw new Error('Invalid role. Only planners can access this dashboard.');
      }

      // Store tokens
      setAuthTokens({
        jwtToken: response.jwtToken,
        expiresAt: response.expiresAt,
      });

      // Store user
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        phone: response.user.phone,
        countryCode: response.user.countryCode,
        role: response.user.role,
      };
      setUser(userData);
      setUserState(userData);

      toast({
        title: 'Success',
        description: isLogin ? 'You have been logged in successfully.' : 'Email verified successfully!',
      });

      // Navigate to dashboard or complete profile
      if (isLogin) {
        navigate('/');
      } else {
        navigate('/complete-profile');
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const resendOtp = async (email: string) => {
    try {
      await apiClient.sendOtp(email);
      toast({
        title: 'OTP Resent',
        description: 'A new verification code has been sent to your email.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend OTP. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    clearAuth();
    setUserState(null);
    navigate('/login');
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully.',
    });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: isAuthenticated() && !!user,
    isLoading,
    login,
    signup,
    verifyOtp,
    logout,
    resendOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

