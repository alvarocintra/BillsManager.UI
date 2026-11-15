import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { LoginResponse, RegisterRequest, TenantAccess, UserInfo } from '../models/auth.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_info';
  private readonly TENANT_KEY = 'active_tenant_id';
  private readonly API_URL = environment.apiUrl + '/auth';
  private expirationTimer: ReturnType<typeof setTimeout> | null = null;
  
  private jwtHelper = new JwtHelperService();
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.restoreSession();
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  register(email: string, password: string, firstName?: string, lastName?: string): Observable<LoginResponse> {
    const request: RegisterRequest = { email, password, firstName, lastName };
    return this.http.post<LoginResponse>(`${this.API_URL}/register`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.TENANT_KEY);
    }
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token || '';
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getTenantId(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const allowedTenants = this.getTenantAccess();
    const storedTenantId = localStorage.getItem(this.TENANT_KEY);
    if (storedTenantId && allowedTenants.some(tenant => tenant.id === storedTenantId)) {
      return storedTenantId;
    }

    const defaultTenantId = allowedTenants[0]?.id ?? null;
    if (defaultTenantId) {
      localStorage.setItem(this.TENANT_KEY, defaultTenantId);
    } else {
      localStorage.removeItem(this.TENANT_KEY);
    }
    return defaultTenantId;
  }

  setTenantId(tenantId: string): void {
    const normalizedTenantId = tenantId.trim();
    if (!normalizedTenantId || !this.getTenantAccess().some(tenant => tenant.id === normalizedTenantId)) {
      throw new Error('The selected tenant is not available to this user');
    }
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TENANT_KEY, normalizedTenantId);
    }
  }

  getTenantAccess(): TenantAccess[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }

    const claims = this.jwtHelper.decodeToken(token) as Record<string, unknown> | null;
    if (!claims) {
      return [];
    }

    const tenantIds = this.parseStringArrayClaim(claims['tenantIds']);
    const tenantRoles = this.parseTenantRolesClaim(claims['tenantRoles']);
    return tenantIds.map((id, index) => ({ id, role: tenantRoles[id] ?? tenantRoles[String(index)] }));
  }

  selectTenant(tenantId: string): void {
    this.setTenantId(tenantId);
  }

  refreshTokenIfNeeded(): Observable<LoginResponse> {
    if (!this.hasValidToken()) {
      return throwError(() => new Error('No valid token to refresh'));
    }
    
    return this.http.post<LoginResponse>(`${this.API_URL}/refresh`, {})
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => this.handleError(error))
      );
  }

  private handleAuthResponse(response: LoginResponse): void {
    if (response && response.token) {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.removeItem(this.TENANT_KEY);
        const tenantAccess = this.getTenantAccess();
        if (tenantAccess.length === 1) {
          localStorage.setItem(this.TENANT_KEY, tenantAccess[0].id);
        }
        const user: UserInfo = {
          email: response.email,
          userId: response.userId,
          firstName: response.firstName,
          lastName: response.lastName
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
        this.scheduleTokenExpirationCheck(response.token);
      }
    }
  }

  private parseStringArrayClaim(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
    }
    if (typeof value !== 'string') {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
        : [];
    } catch {
      return [];
    }
  }

  private parseTenantRolesClaim(value: unknown): Record<string, string> {
    if (Array.isArray(value)) {
      return Object.fromEntries(value
        .filter((role): role is string => typeof role === 'string')
        .map((role, index) => [String(index), role]));
    }

    if (typeof value !== 'string') {
      return {};
    }

    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return Object.fromEntries(parsed
          .filter((role): role is string => typeof role === 'string')
          .map((role, index) => [String(index), role]));
      }
      if (parsed && typeof parsed === 'object') {
        return Object.fromEntries(Object.entries(parsed)
          .filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
      }
    } catch {
      return {};
    }

    return {};
  }

  private hasValidToken(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return false;
    }
    
    const isExpired = this.jwtHelper.isTokenExpired(token);
    if (isExpired) {
      this.logout();
      return false;
    }
    
    return true;
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token || this.jwtHelper.isTokenExpired(token)) {
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      return;
    }

    const user = this.getUserFromStorage();
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    this.scheduleTokenExpirationCheck(token);
  }

  private scheduleTokenExpirationCheck(token: string): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = null;
    }

    const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
    if (!expirationDate) {
      return;
    }

    const timeToExpiration = expirationDate.getTime() - Date.now();
    if (timeToExpiration <= 0) {
      this.logout();
      return;
    }

    this.expirationTimer = setTimeout(() => {
      this.logout();
    }, timeToExpiration);
  }

  private checkTokenExpiration(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this.scheduleTokenExpirationCheck(token);
    }
  }

  private getUserFromStorage(): any {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred during authentication';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Invalid email or password';
    } else if (error.status === 409) {
      errorMessage = 'Email already registered';
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
