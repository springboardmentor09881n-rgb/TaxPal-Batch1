import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiService } from './api';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  const api = inject(ApiService);
  
  return next(req).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/auth/refresh') &&
        !req.url.includes('/auth/login')
      ) {
        // Try to refresh token
        return api.refreshToken().pipe(
          switchMap((res: any) => {
            const newAccessToken = res.data?.accessToken || res.accessToken;
            if (newAccessToken) {
              localStorage.setItem('accessToken', newAccessToken);
              // Clone the original request with the new access token
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newAccessToken}`
                }
              });
              return next(clonedReq);
            }
            // If refresh fails, log out
            logoutAndRedirect(router);
            return throwError(() => error);
          }),
          catchError((refreshErr) => {
            logoutAndRedirect(router);
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

function logoutAndRedirect(router: Router) {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  router.navigate(['/']);
}
