/**
 * SmarterOS Identity - Servicio de Autenticación
 * Maneja JWT tokens y sesión de usuario
 */

import { supabase } from './supabase';

export interface UserToken {
  rut: string;
  role: string;
  scopes: string[];
  exp: number;
  iat: number;
}

export interface AuthResponse {
  token: string;
  user: {
    rut: string;
    role: string;
    scopes: string[];
    devices: number;
  };
}

const TOKEN_KEY = 'smarter_auth_token';
const API_BASE = 'https://rut.smarterbot.store';

/**
 * Guardar token en localStorage
 */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Obtener token guardado
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Eliminar token (logout)
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decodificar JWT (sin validar firma)
 */
export function decodeToken(token: string): UserToken | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('[Auth] Error decoding token:', err);
    return null;
  }
}

/**
 * Verificar si token es válido y no expiró
 */
export function isTokenValid(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return false;
  
  // Expira en 5 minutos (margen de seguridad)
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp > now + 300;
}

/**
 * Login con RUT + device_id
 */
export async function loginWithRut(rut: string, deviceId: string): Promise<AuthResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rut, device_id: deviceId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    const data: AuthResponse = await response.json();
    
    // Guardar token
    saveToken(data.token);
    
    // Guardar sesión en Supabase también
    if (supabase) {
      const { data: sbData } = await supabase.auth.signInWithCustomToken(data.token);
      if (sbData?.user) {
        console.log('[Auth] Supabase session created');
      }
    }
    
    console.log('[Auth] Login exitoso:', data.user.rut);
    return data;
  } catch (err: any) {
    console.error('[Auth] Login error:', err.message);
    return null;
  }
}

/**
 * Obtener perfil de usuario autenticado
 */
export async function getProfile(): Promise<UserToken | null> {
  const token = getToken();
  if (!token) return null;
  
  if (!isTokenValid(token)) {
    console.log('[Auth] Token expirado');
    removeToken();
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
      }
      return null;
    }
    
    return await response.json();
  } catch (err) {
    console.error('[Auth] Get profile error:', err);
    return null;
  }
}

/**
 * Logout completo
 */
export async function logout(): Promise<void> {
  removeToken();
  
  if (supabase) {
    await supabase.auth.signOut();
  }
  
  console.log('[Auth] Logout completado');
}

/**
 * Obtener scopes del usuario
 */
export function getScopes(): string[] {
  const token = getToken();
  if (!token) return [];
  
  const decoded = decodeToken(token);
  return decoded?.scopes || [];
}

/**
 * Verificar si usuario tiene scope específico
 */
export function hasScope(scope: string): boolean {
  const scopes = getScopes();
  return scopes.includes(scope);
}
