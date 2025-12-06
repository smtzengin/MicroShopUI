import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from '../services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthStateService);
  const token = authService.getToken();

  console.log('Auth interceptor - URL:', req.url);
  console.log('Auth interceptor - Token var mı:', !!token);
  console.log('Auth interceptor - Auth gerekli mi:', shouldAddAuthHeader(req.url));

  if (token && shouldAddAuthHeader(req.url)) {
    console.log('Auth header ekleniyor:', req.url);
    console.log('Token (first 20 chars):', token.substring(0, 20));
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    console.log('Authorization header:', authReq.headers.get('Authorization')?.substring(0, 30));
    console.log('All headers:', authReq.headers.keys().map(key => `${key}: ${authReq.headers.get(key)?.substring(0, 50)}`));
    return next(authReq);
  }

  console.log('Auth header eklenmedi:', req.url);
  return next(req);
};

function shouldAddAuthHeader(url: string): boolean {
  const authRequiredPatterns = [
    '/api/Basket',
    '/api/Order',
    '/api/Payment',
  ];

  const authNotRequiredPatterns = [
    '/api/Auth/login',
    '/api/Auth/register',
    '/api/Stock',
  ];

  if (authNotRequiredPatterns.some(pattern => url.includes(pattern))) {
    return false;
  }

  return authRequiredPatterns.some(pattern => url.includes(pattern));
}
