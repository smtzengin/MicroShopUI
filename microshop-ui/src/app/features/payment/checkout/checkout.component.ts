import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, firstValueFrom } from 'rxjs';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputMaskModule } from 'primeng/inputmask';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { StepsModule } from 'primeng/steps';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { BasketStateService, BasketSummary, BasketItem } from '../../../shared/services/basket-state.service';
import { AuthStateService } from '../../../shared/services/auth-state.service';
import { PaymentService } from '../../../api/payment';
import { OrderService, CreateOrderDto, AddressDto, OrderItemDto, CreditCardDto, PaymentType } from '../../../api/order';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface City {
  name: string;
  code: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputTextareaModule,
    InputMaskModule,
    DropdownModule,
    RadioButtonModule,
    CheckboxModule,
    DividerModule,
    StepsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  basketItems$!: Observable<BasketItem[]>;
  basketSummary$!: Observable<BasketSummary>;

  activeIndex: number = 0;

  addressForm!: FormGroup;
  paymentForm!: FormGroup;

  isProcessingPayment = false;

  // Steps for checkout process
  steps = [
    { label: 'Teslimat Adresi' },
    { label: 'Ödeme Bilgileri' },
    { label: 'Onay' }
  ];

  // Payment methods
  paymentMethods: PaymentMethod[] = [
    {
      id: 'credit-card',
      name: 'Kredi Kartı',
      icon: 'pi pi-credit-card',
      description: 'Güvenli kredi kartı ile ödeme'
    },
    {
      id: 'debit-card',
      name: 'Banka Kartı',
      icon: 'pi pi-credit-card',
      description: 'Banka kartı ile ödeme'
    },
    {
      id: 'bank-transfer',
      name: 'Havale/EFT',
      icon: 'pi pi-building',
      description: 'Banka havalesi ile ödeme'
    }
  ];

  // Cities
  cities: City[] = [
    { name: 'Adana', code: '01' },
    { name: 'Ankara', code: '06' },
    { name: 'Antalya', code: '07' },
    { name: 'Bursa', code: '16' },
    { name: 'Eskişehir', code: '26' },
    { name: 'İstanbul', code: '34' },
    { name: 'İzmir', code: '35' },
    { name: 'Kayseri', code: '38' },
    { name: 'Konya', code: '42' },
    { name: 'Mersin', code: '33' },
    { name: 'Trabzon', code: '61' }
  ];

  selectedPaymentMethod = 'credit-card';

  constructor(
    private fb: FormBuilder,
    private basketStateService: BasketStateService,
    private authStateService: AuthStateService,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.basketItems$ = this.basketStateService.basketItems$;
    this.basketSummary$ = this.basketStateService.basketSummary$;

    // Kullanıcı giriş yapmış mı kontrol et
    if (!this.authStateService.isAuthenticated()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Giriş Gerekli',
        detail: 'Ödeme yapmak için giriş yapmanız gerekiyor.'
      });
      this.router.navigate(['/auth/login']);
    }

    // Sepet boş mu kontrol et
    this.basketSummary$.subscribe(summary => {
      if (summary.totalItems === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sepet Boş',
          detail: 'Ödeme yapmak için sepetinizde ürün bulunmalıdır.'
        });
        this.router.navigate(['/shop']);
      }
    });
  }

  private initializeForms() {
    this.addressForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^(05)[0-9]{9}$')]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],
      district: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]]
    });

    this.paymentForm = this.fb.group({
      paymentMethod: [this.selectedPaymentMethod, Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4}$')]],
      expiryDate: ['', [Validators.required, Validators.pattern('^[0-9]{2}/[0-9]{2}$')]],
      cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3,4}$')]],
      cardholderName: ['', [Validators.required, Validators.minLength(3)]],
      agreeTerms: [false, Validators.requiredTrue]
    });
  }

  nextStep() {
    if (this.activeIndex === 0) {
      if (this.addressForm.valid) {
        this.activeIndex++;
      } else {
        this.markFormGroupTouched(this.addressForm);
        this.messageService.add({
          severity: 'warn',
          summary: 'Form Hatası',
          detail: 'Lütfen tüm alanları doğru şekilde doldurun.'
        });
      }
    } else if (this.activeIndex === 1) {
      if (this.paymentForm.valid) {
        this.activeIndex++;
      } else {
        this.markFormGroupTouched(this.paymentForm);
        this.messageService.add({
          severity: 'warn',
          summary: 'Form Hatası',
          detail: 'Lütfen ödeme bilgilerini doğru şekilde doldurun.'
        });
      }
    }
  }

  previousStep() {
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  onPaymentMethodChange() {
    const paymentMethodControl = this.paymentForm.get('paymentMethod');
    this.selectedPaymentMethod = paymentMethodControl?.value || 'credit-card';

    // Havale seçilirse kredi kartı alanlarını temizle ve disable et
    if (this.selectedPaymentMethod === 'bank-transfer') {
      this.paymentForm.get('cardNumber')?.disable();
      this.paymentForm.get('expiryDate')?.disable();
      this.paymentForm.get('cvv')?.disable();
      this.paymentForm.get('cardholderName')?.disable();
    } else {
      this.paymentForm.get('cardNumber')?.enable();
      this.paymentForm.get('expiryDate')?.enable();
      this.paymentForm.get('cvv')?.enable();
      this.paymentForm.get('cardholderName')?.enable();
    }
  }

  async completePayment() {
    this.isProcessingPayment = true;

    try {
      console.log('Sipariş oluşturma başlıyor...');

      // Auth durumu kontrol et
      console.log('Auth durumu:', this.authStateService.isAuthenticated());
      console.log('Token var mı:', !!this.authStateService.getToken());
      console.log('Token değeri:', this.authStateService.getToken()?.substring(0, 20) + '...');

      // Form verilerini al
      const addressData = this.addressForm.value;
      const paymentData = this.paymentForm.value;

      // User ID al
      const userId = this.authStateService.getCurrentUserId();
      console.log('User ID:', userId);

      if (!userId) {
        throw new Error('Kullanıcı ID bulunamadı');
      }      // Sepet verilerini al
      const basketItems = await firstValueFrom(this.basketItems$);

      if (!basketItems || basketItems.length === 0) {
        throw new Error('Sepet boş');
      }

      // Address DTO oluştur
      const addressDto: AddressDto = {
        line: addressData.address,
        city: addressData.city,
        district: addressData.district,
        zipCode: addressData.postalCode
      };

      // Order items DTO oluştur
      const orderItemsDto: OrderItemDto[] = basketItems.map(item => ({
        productId: item.productId,
        productName: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      // Payment type belirle
      let paymentType: PaymentType = PaymentType.NUMBER_0; // Credit Card
      if (this.selectedPaymentMethod === 'bank-transfer') {
        paymentType = PaymentType.NUMBER_1; // Bank Transfer
      }

      // Credit Card bilgileri (eğer kart ödemesi ise)
      let creditCardDto: CreditCardDto | undefined;
      if (this.selectedPaymentMethod !== 'bank-transfer') {
        creditCardDto = {
          cardNumber: paymentData.cardNumber?.replace(/\s+/g, ''),
          holderName: paymentData.cardholderName,
          expiration: paymentData.expiryDate,
          cvv: paymentData.cvv
        };
      }

      // CreateOrderDto oluştur
      const createOrderDto: CreateOrderDto = {
        userId: userId,
        address: addressDto,
        items: orderItemsDto,
        paymentType: paymentType,
        cardInfo: creditCardDto,
        couponCode: null // İleride kupon sistemi eklenebilir
      };

      console.log('Sipariş verisi:', createOrderDto);

      console.log('Final auth check - Token:', !!this.authStateService.getToken());
      console.log('Final auth check - Authenticated:', this.authStateService.isAuthenticated());      // Token süresi kontrol et
      if (!this.authStateService.isAuthenticated()) {
        throw new Error('Token süresi dolmuş - kullanıcı authenticated değil');
      }

      // Siparişi oluştur
      console.log('Order Service API çağrısı başlıyor...');
      const orderResponse = await firstValueFrom(this.orderService.apiOrderPost(createOrderDto));
      console.log('Sipariş başarıyla oluşturuldu:', orderResponse);      // Sepeti temizle
      this.basketStateService.clearBasket();

      this.messageService.add({
        severity: 'success',
        summary: 'Sipariş Başarılı',
        detail: 'Siparişiniz başarıyla oluşturuldu!'
      });

      // Shop sayfasına yönlendir (orders sayfası henüz yok)
      setTimeout(() => {
        this.router.navigate(['/shop']);
      }, 2000);

    } catch (error) {
      console.error('Sipariş oluşturma hatası:', error);
      console.error('Error type:', error);
      console.error('Error status:', (error as any)?.status);
      console.error('Error message:', (error as any)?.message);
      console.error('Error details:', (error as any)?.error);

      // 401 Unauthorized durumunu özellikle kontrol et
      if ((error as any)?.status === 401) {
        console.error('401 UNAUTHORIZED - Token süresi dolmuş olabilir!');
        console.error('Current token:', this.authStateService.getToken()?.substring(0, 20));
        console.error('Is authenticated:', this.authStateService.isAuthenticated());

        // Kullanıcıyı logout yap ve login sayfasına yönlendir
        this.authStateService.logout();
        this.messageService.add({
          severity: 'warn',
          summary: 'Oturum Süresi Doldu',
          detail: 'Tekrar giriş yapmanız gerekiyor.'
        });
        this.router.navigate(['/auth/login']);
        return;
      }

      this.messageService.add({
        severity: 'error',
        summary: 'Sipariş Hatası',
        detail: 'Sipariş oluşturma sırasında bir hata oluştu.'
      });
    } finally {
      this.isProcessingPayment = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control?.invalid) {
        control.updateValueAndValidity();
      }
    });
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string | null {
    const field = formGroup.get(fieldName);
    if (field?.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) return `${this.getFieldLabel(fieldName)} zorunludur.`;
      if (field.errors?.['email']) return 'Geçerli bir e-posta adresi girin.';
      if (field.errors?.['minlength']) return `${this.getFieldLabel(fieldName)} en az ${field.errors['minlength'].requiredLength} karakter olmalıdır.`;
      if (field.errors?.['pattern']) {
        if (fieldName === 'phone') return 'Telefon numarası 05 ile başlamalı ve 11 haneli olmalıdır. (Örn: 05XXXXXXXXX)';
        if (fieldName === 'postalCode') return 'Geçerli bir posta kodu girin.';
        if (fieldName === 'cardNumber') return 'Kart numarası 16 haneli olmalıdır. (Örn: 1234 5678 9012 3456)';
        if (fieldName === 'expiryDate') return 'AA/YY formatında girin.';
        if (fieldName === 'cvv') return 'Geçerli bir CVV girin.';
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'Ad',
      lastName: 'Soyad',
      email: 'E-posta',
      phone: 'Telefon',
      address: 'Adres',
      city: 'Şehir',
      district: 'İlçe',
      postalCode: 'Posta Kodu',
      cardNumber: 'Kart Numarası',
      expiryDate: 'Son Kullanma Tarihi',
      cvv: 'CVV',
      cardholderName: 'Kart Sahibi Adı'
    };
    return labels[fieldName] || fieldName;
  }

  goBackToBasket() {
    this.router.navigate(['/basket']);
  }

  getMaskedCardNumber(): string {
    const cardNumber = this.paymentForm.get('cardNumber')?.value;
    if (!cardNumber) return '';

    const cleanNumber = cardNumber.replace(/\s+/g, '');
    if (cleanNumber.length < 4) return '';

    return '**** **** **** ' + cleanNumber.slice(-4);
  }
}
