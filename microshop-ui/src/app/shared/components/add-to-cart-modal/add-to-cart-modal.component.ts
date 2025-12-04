import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';

import { BasketStateService, BasketItem } from '../../services/basket-state.service';
import { Observable } from 'rxjs';

export interface AddToCartModalData {
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  addedQuantity: number;
}

@Component({
  selector: 'app-add-to-cart-modal',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DialogModule,
    ButtonModule,
    BadgeModule
  ],
  templateUrl: './add-to-cart-modal.component.html',
  styleUrl: './add-to-cart-modal.component.scss'
})
export class AddToCartModalComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() productData: AddToCartModalData | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() continueShoppingClick = new EventEmitter<void>();
  @Output() goToCartClick = new EventEmitter<void>();

  basketSummary$ !: Observable<any>;

  constructor(private basketStateService: BasketStateService) {}

  ngOnInit() {
    this.basketSummary$ = this.basketStateService.basketSummary$;
  }

  closeModal() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onContinueShopping() {
    this.continueShoppingClick.emit();
    this.closeModal();
  }

  onGoToCart() {
    this.goToCartClick.emit();
    this.closeModal();
  }
}
