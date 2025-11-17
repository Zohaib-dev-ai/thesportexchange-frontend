// Authentication service
// This file handles all authentication-related logic for both admin and investor

import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id?: string;
    email: string;
    role?: 'admin' | 'investor';
    first_name?: string;
    last_name?: string;
  };
  investor?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
  error?: string;
}

/**
 * Login user via API
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const { response, data } = await api.login(credentials.email, credentials.password);

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Login failed",
      };
    }

    return {
      success: true,
      token: `mock-token-${data.data.id}`, // Generate a mock token
      user: {
        id: data.data.id.toString(),
        email: data.data.email,
        role: data.data.role,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

/**
 * Login investor via API
 */
export async function loginInvestor(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const { response, data } = await api.investorLogin(credentials.email, credentials.password);

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Login failed",
      };
    }

    return {
      success: true,
      token: `mock-token-investor-${data.data.id}`, // Generate a mock token
      investor: {
        id: data.data.id.toString(),
        first_name: data.data.full_name,
        last_name: '',
        email: data.data.email,
        role: 'investor',
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Network error. Please try again.",
    };
  }
}

/**
 * Store authentication token and user data
 */
export function setAuthData(token: string, userEmail: string, role: 'admin' | 'investor' = 'admin', userId?: string): void {
  localStorage.setItem("authToken", token);
  localStorage.setItem("userEmail", userEmail);
  localStorage.setItem("userRole", role);
  if (userId) {
    localStorage.setItem("userId", userId);
  }
  localStorage.setItem("isAuthenticated", "true");
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("isAuthenticated") === "true" && !!getAuthToken();
}

/**
 * Get user email
 */
export function getUserEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userEmail");
}

/**
 * Get user role
 */
export function getUserRole(): 'admin' | 'investor' | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userRole") as 'admin' | 'investor' | null;
}

/**
 * Get user ID
 */
export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userId");
}

/**
 * Clear authentication data (logout)
 */
export function clearAuthData(): void {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");
  localStorage.removeItem("isAuthenticated");
}

/**
 * Verify token (to be implemented with database)
 * TODO: Add API call to verify token with backend
 */
export async function verifyToken(token: string): Promise<boolean> {
  // TODO: Implement token verification with backend
  // Example: const response = await fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } });
  return !!token;
}
