import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { LoginResponse, RegisterRequest, UserInfo } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_info';
  private readonly API_URL = 'http://localhost:5000/api/auth';
  
  private jwtHelper = new JwtHelperService();
  private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.checkTokenExpiration();
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
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
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
        const user: UserInfo = {
          email: response.email,
          userId: response.userId,
          firstName: response.firstName,
          lastName: response.lastName
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }
    }
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

  private checkTokenExpiration(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      const expirationDate = this.jwtHelper.getTokenExpirationDate(token);
      if (expirationDate) {
        const timeToExpiration = expirationDate.getTime() - Date.now();
        if (timeToExpiration > 0) {
          setTimeout(() => {
            this.logout();
          }, timeToExpiration);
        } else {
          this.logout();
        }
      }
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
