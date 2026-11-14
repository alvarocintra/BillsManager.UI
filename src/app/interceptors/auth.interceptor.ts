import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Authentication endpoints do not require an active tenant.
    const isAuthEndpoint = request.url.includes('/api/auth/login') || 
                          request.url.includes('/api/auth/register') ||
                          request.url.includes('/auth/login') ||
                          request.url.includes('/auth/register');
    
    const token = this.authService.getToken();

    if (token && !isAuthEndpoint) {
      const tenantId = this.authService.getTenantId();
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          ...(tenantId ? { 'X-Tenant-Id': tenantId } : {})
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.logout();
          this.toastr.error('Session expired. Please login again.');
          this.router.navigate(['/login']);
        } else if (error.status === 403) {
          this.toastr.error('You do not have permission to access this resource.');
        }
        
        return throwError(() => error);
      })
    );
  }
}
