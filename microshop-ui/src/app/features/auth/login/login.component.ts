import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG Modülleri (Sadece bu sayfada lazım olanlar)
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { AuthService } from '../../../api/identity';
import { AuthStateService } from '../../../shared/services/auth-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
    FloatLabelModule,
    CheckboxModule
  ],
  providers: [MessageService], // Toast servisi için gerekli
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false; // Butonda dönen yükleniyor simgesi için

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private authStateService: AuthStateService,
    private router: Router,
    private messageService: MessageService
  ) {
    // Form Validasyon Kuralları
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); // Hataları kırmızı yak
      return;
    }

    this.loading = true; // Butonu kilitle

    this.authService.apiAuthLoginPost(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('Login API Response:', res);
        this.loading = false;

        // Farklı response formatlarını kontrol et
        if (res.isSuccess || res.success || res.Status === 'Success') {
          console.log('Login başarılı, response:', res);

          // Response data'yı farklı yerlerden almayı dene
          const responseData = res.data || res.result || res;
          console.log('Response data:', responseData);

          // Token ve user bilgilerini farklı field'lardan almayı dene
          const token = responseData.accessToken || responseData.token || responseData.access_token;
          const refreshToken = responseData.refreshToken || responseData.refresh_token || '';
          const userId = responseData.id || responseData.userId || responseData.user_id;
          const userName = responseData.userName || responseData.name || responseData.fullName || responseData.username;

          console.log('Extracted values:', { token, userId, userName });

          if (token) {
            // User ID yoksa JWT'den çıkarmaya çalış
            let finalUserId = userId;
            if (!finalUserId) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                finalUserId = payload.sub || payload.userId || payload.user_id || payload.nameid || payload.id;
                console.log('JWT payload:', payload);
                console.log('User ID JWT\'den çıkarıldı:', finalUserId);
              } catch (error) {
                console.error('JWT parse hatası:', error);
              }
            }

            // AuthStateService'e token ve user bilgilerini set et
            this.authStateService.loginSuccess(
              token,
              refreshToken,
              {
                id: finalUserId || `user_${Date.now()}`, // Fallback ID
                email: this.loginForm.value.email,
                name: userName
              }
            );

            this.messageService.add({ severity: 'success', summary: 'Başarılı', detail: 'Giriş yapıldı!' });
            this.router.navigate(['/shop']);
          } else {
            console.log('Token bulunamadı, response data:', responseData);
            this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Token bilgisi alınamadı' });
          }
        } else {
          console.log('Login başarısız, response:', res);
          this.messageService.add({ severity: 'error', summary: 'Hata', detail: res.errorMessage || res.message || 'Giriş başarısız' });
        }
      },
      error: (err) => {
       console.log('Login error:', err);
       this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Sunucu Hatası', detail: 'Bağlantı kurulamadı.' });
      }
    });
  }

  // Hata mesajı gösterme yardımcısı
  showError(msg: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Hata',
      detail: msg,
      life: 3000
    });
  }
}
