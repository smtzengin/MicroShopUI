import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_info';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor() {
    console.log('AuthStateService başlatıldı');
    console.log('Token:', this.getToken());
    console.log('User:', this.getUserFromStorage());
    console.log('hasValidToken:', this.hasValidToken());
  }

  // Token işlemleri
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.updateAuthState();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Kullanıcı işlemleri
  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.updateAuthState();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Authentication durumu kontrolü
  isAuthenticated(): boolean {
    const hasToken = this.hasValidToken();
    const hasUser = this.getCurrentUser() !== null;
    const result = hasToken && hasUser;

    console.log('Authentication kontrol:', {
      hasValidToken: hasToken,
      hasUser: hasUser,
      isAuthenticated: result,
      user: this.getCurrentUser()
    });

    return result;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) {
      console.log('Token yok');
      return false;
    }

    // Token'ın geçerliliğini kontrol et (JWT decode ederek expire time check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const isValid = payload.exp > currentTime;
      console.log('Token geçerlilik kontrolü:', {
        token: token.substring(0, 20) + '...',
        exp: payload.exp,
        currentTime,
        isValid
      });
      return isValid;
    } catch (error) {
      console.log('Token decode hatası:', error);
      return false;
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  // Login success sonrası
  loginSuccess(token: string, refreshToken: string, user: User): void {
    console.log('loginSuccess çağrıldı:', { token, user });
    this.setToken(token);
    this.setRefreshToken(refreshToken);
    this.setUser(user);
    console.log('Login sonrası durumlar:', {
      isLoggedIn: this.isLoggedInSubject.value,
      currentUser: this.currentUserSubject.value
    });
  }

  private updateAuthState(): void {
    const isAuth = this.isAuthenticated();
    this.isLoggedInSubject.next(isAuth);
  }

  // User ID getter (sepet işlemleri için)
  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    if (user?.id && user.id !== 'temp-id') {
      return user.id;
    }

    // Eğer user ID yoksa JWT token'dan çıkarmaya çalış
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // JWT'deki yaygın user ID field'ları
        const userId = payload.sub || payload.userId || payload.user_id || payload.nameid || payload.id;
        console.log('JWT payload:', payload);
        console.log('Extracted userId from token:', userId);

        if (userId) {
          // User object'ini güncelle
          if (user) {
            const updatedUser = { ...user, id: userId };
            this.setUser(updatedUser);
          }
          return userId;
        }
      } catch (error) {
        console.error('JWT token parse hatası:', error);
      }
    }

    console.warn('User ID bulunamadı!');
    return null;
  }
}
