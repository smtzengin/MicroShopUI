import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from '../services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthStateService);
  const token = authService.getToken();

  // Eğer token varsa ve authentication gerektiren endpoint ise header ekle
  if (token && shouldAddAuthHeader(req.url)) {
    console.log('Auth header ekleniyor:', req.url);
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  return next(req);
};

// Hangi endpoint'lerin auth gerektirdiğini belirle
function shouldAddAuthHeader(url: string): boolean {
  const authRequiredPatterns = [
    '/api/Basket',     // Basket API
    '/api/Order',      // Order API
    '/api/Payment',    // Payment API
    // Login endpoint'i hariç
  ];

  const authNotRequiredPatterns = [
    '/api/Auth/login',
    '/api/Auth/register',
    '/api/Stock',      // Stock API public olabilir
  ];

  // Önce auth gerektirmeyenleri kontrol et
  if (authNotRequiredPatterns.some(pattern => url.includes(pattern))) {
    return false;
  }

  // Sonra auth gerekenleri kontrol et
  return authRequiredPatterns.some(pattern => url.includes(pattern));
}
