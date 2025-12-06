import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';

import { BasketStateService, BasketItem, BasketSummary } from '../../../shared/services/basket-state.service';
import { AuthStateService } from '../../../shared/services/auth-state.service';

@Component({
  selector: 'app-basket',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    CardModule,
    DividerModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './basket.component.html',
  styleUrl: './basket.component.scss'
})
export class BasketComponent implements OnInit {
  basketItems$!: Observable<BasketItem[]>;
  basketSummary$!: Observable<BasketSummary>;
  basketLoading$!: Observable<boolean>;
  isLoggedIn$!: Observable<boolean>;

  constructor(
    private basketStateService: BasketStateService,
    private authStateService: AuthStateService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.basketItems$ = this.basketStateService.basketItems$;
    this.basketSummary$ = this.basketStateService.basketSummary$;
    this.basketLoading$ = this.basketStateService.basketLoading$;
    this.isLoggedIn$ = this.authStateService.isLoggedIn$;
  }

  updateQuantity(itemId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeItem(itemId);
      return;
    }
    this.basketStateService.updateQuantity(itemId, newQuantity);
    this.messageService.add({
      severity: 'success',
      summary: 'Güncellendi',
      detail: 'Ürün miktarı güncellendi'
    });
  }

  removeItem(itemId: string) {
    this.confirmationService.confirm({
      message: 'Bu ürünü sepetten kaldırmak istediğinizden emin misiniz?',
      header: 'Ürün Kaldır',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.basketStateService.removeFromBasket(itemId);
        this.messageService.add({
          severity: 'info',
          summary: 'Kaldırıldı',
          detail: 'Ürün sepetten kaldırıldı'
        });
      }
    });
  }

  clearBasket() {
    this.confirmationService.confirm({
      message: 'Sepeti tamamen boşaltmak istediğinizden emin misiniz?',
      header: 'Sepeti Boşalt',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.basketStateService.clearBasket();
        this.messageService.add({
          severity: 'info',
          summary: 'Temizlendi',
          detail: 'Sepet boşaltıldı'
        });
      }
    });
  }

  proceedToCheckout() {
    if (!this.authStateService.isAuthenticated()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Giriş Gerekli',
        detail: 'Ödeme yapmak için giriş yapmanız gerekiyor.'
      });
      this.router.navigate(['/auth/login']);
      return;
    }

    // Check if basket is not empty
    this.basketSummary$.subscribe(summary => {
      if (summary.totalItems === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sepet Boş',
          detail: 'Ödeme yapmak için sepetinizde ürün bulunmalıdır.'
        });
        return;
      }

      // Navigate to checkout
      this.router.navigate(['/checkout']);
    });
  }

  trackByItemId(index: number, item: BasketItem): string {
    return item.id;
  }
}
