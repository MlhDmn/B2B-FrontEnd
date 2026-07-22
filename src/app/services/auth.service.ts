import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { map, tap } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  userId: number | string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  user: AuthUser;
}

export enum UserPermission {
  ViewProducts = 1,
  AddProducts = 2,
  DeleteProducts = 4,
  EditProducts = 8,
  ManageCategories = 16,
  ManageUsers = 32,
  Admin = ViewProducts | AddProducts | DeleteProducts | EditProducts | ManageCategories | ManageUsers
}

interface JwtPayload {
  exp?: number;
  permissions?: string | number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:5072/api/auth';
  private readonly tokenKey = 'access_token';

  constructor(
    private readonly http: HttpClient,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  register(request: RegisterRequest) {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, request).pipe(
      map(response => unwrapApiResponse(response, 'Registration failed. Please try again.')),
      tap(response => this.saveToken(response.token))
    );
  }

  login(request: LoginRequest) {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, request).pipe(
      map(response => unwrapApiResponse(response, 'Login failed. Please try again.')),
      tap(response => this.saveToken(response.token))
    );
  }

  getCurrentUser() {
    return this.http.get<ApiResponse<AuthUser> | AuthUser | Record<string, unknown>>(`${this.apiUrl}/me`).pipe(
      map(response => this.normalizeCurrentUser(response))
    );
  }

  getCurrentUserFromToken(): AuthUser | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    const payload = this.decodeTokenPayload(token);
    return payload ? this.normalizeUserPayload(payload) : null;
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const token = localStorage.getItem(this.tokenKey);

    if (token && this.isTokenExpired(token)) {
      this.logout();
      return null;
    }

    return token;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getPermissions(): number {
    const token = this.getToken();

    if (!token) {
      return 0;
    }

    const payload = this.decodeTokenPayload(token);
    const permissions = payload?.permissions;

    return typeof permissions === 'number'
      ? permissions
      : Number(permissions) || 0;
  }

  hasPermission(permission: UserPermission): boolean {
    return (this.getPermissions() & permission) === permission;
  }

  canAccessAdminPanel(): boolean {
    const managementPermissions = UserPermission.Admin & ~UserPermission.ViewProducts;
    return (this.getPermissions() & managementPermissions) !== 0;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
    }
  }

  private saveToken(token: string): void {
    if (token && isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  private decodeTokenPayload(token: string): JwtPayload | null {
    const payload = token.split('.')[1];

    if (!payload || !isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(
        normalizedPayload.length + (4 - normalizedPayload.length % 4) % 4,
        '='
      );

      return JSON.parse(atob(paddedPayload)) as JwtPayload;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenPayload(token);

    if (typeof payload?.exp !== 'number') {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  }

  private normalizeCurrentUser(response: ApiResponse<AuthUser> | AuthUser | Record<string, unknown>): AuthUser {
    const responseData = this.isApiResponse(response) ? response.data : response;

    if (!responseData) {
      throw new Error('Current user could not be loaded.');
    }

    const user = this.normalizeUserPayload(responseData as Record<string, unknown>);

    if (!user) {
      throw new Error('Current user could not be loaded.');
    }

    return user;
  }

  private normalizeUserPayload(payload: Record<string, unknown>): AuthUser | null {
    const userId = this.readPayloadValue(payload, [
      'userId',
      'sub',
      'nameid',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
    ]);
    const email = this.readPayloadValue(payload, [
      'email',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'
    ]);
    const firstName = this.readPayloadValue(payload, [
      'firstName',
      'given_name',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'
    ]);
    const lastName = this.readPayloadValue(payload, [
      'lastName',
      'family_name',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
    ]);
    const fullName = this.readPayloadValue(payload, [
      'fullName',
      'name',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
    ]);
    const normalizedFullName = fullName || [firstName, lastName].filter(Boolean).join(' ');

    if (!email && !normalizedFullName) {
      return null;
    }

    return {
      userId,
      email,
      firstName,
      lastName,
      fullName: normalizedFullName || email
    };
  }

  private readPayloadValue(payload: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = payload[key];

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }

      if (typeof value === 'number') {
        return String(value);
      }
    }

    return '';
  }

  private isApiResponse(value: unknown): value is ApiResponse<AuthUser> {
    return typeof value === 'object'
      && value !== null
      && 'data' in value
      && 'hasError' in value;
  }
}
