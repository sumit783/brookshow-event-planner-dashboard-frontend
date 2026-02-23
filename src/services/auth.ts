/**
 * Authentication Service
 * 
 * Manages authentication tokens and user session
 */

export interface AuthTokens {
  jwtToken: string;
  expiresAt: number; // timestamp
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  countryCode?: string;
  role?: string;
}

const JWT_TOKEN_KEY = 'jwt_token';
const EXPIRES_AT_KEY = 'expires_at';
const USER_KEY = 'user';

/**
 * Get stored JWT token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(JWT_TOKEN_KEY);
}

/**
 * Get stored refresh token (for backward compatibility)
 */
export function getRefreshToken(): string | null {
  return null; // Not used with JWT
}

/**
 * Get token expiration timestamp
 */
export function getTokenExpiration(): number | null {
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
  return expiresAt ? parseInt(expiresAt, 10) : null;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const expiresAt = getTokenExpiration();
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}

/**
 * Store authentication tokens
 */
export function setAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem(JWT_TOKEN_KEY, tokens.jwtToken);
  localStorage.setItem(EXPIRES_AT_KEY, tokens.expiresAt.toString());
}

/**
 * Store user information
 */
export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get stored user information
 */
export function getUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
  localStorage.removeItem(JWT_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  return !isTokenExpired();
}

