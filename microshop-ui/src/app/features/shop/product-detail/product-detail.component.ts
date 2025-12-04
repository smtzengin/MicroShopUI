import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// API Servisleri
import { StockService, Product } from '../../../api/stock';
import { AuthStateService } from '../../../shared/services/auth-state.service';
import { BasketStateService } from '../../../shared/services/basket-state.service';
import { AddToCartModalComponent, AddToCartModalData } from '../../../shared/components/add-to-cart-modal/add-to-cart-modal.component';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber'; // Adet seçimi için
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { DividerModule } from 'primeng/divider';
import { ImageModule } from 'primeng/image'; // Resim büyütme özelliği
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputNumberModule,
    TagModule,
    RatingModule,
    DividerModule,
    ImageModule,
    ToastModule,
    AddToCartModalComponent
  ],
  providers: [MessageService],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  quantity: number = 1; // Seçilen adet
  loading: boolean = true;

  // Modal için
  showAddToCartModal: boolean = false;
  modalData: AddToCartModalData | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService,
    private basketStateService: BasketStateService,
    private messageService: MessageService,
    private authStateService: AuthStateService
  ) {}

  ngOnInit() {
    // URL'deki 'id' parametresini al
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string) {
    this.loading = true;
    this.stockService.apiStockIdGet(id).subscribe({
      next: (res) => {
        this.product = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Ürün bulunamadı.' });
        this.loading = false;
        // Hata varsa listeye dön
        setTimeout(() => this.router.navigate(['/shop']), 2000);
      }
    });
  }

  addToBasket() {
    console.log('addToBasket çağrıldı');
    console.log('Auth durumu:', this.authStateService.isAuthenticated());

    // 1. Authentication kontrolü
    if (!this.authStateService.isAuthenticated()) {
      console.log('Authentication başarısız, login sayfasına yönlendiriliyor');
      this.messageService.add({
        severity: 'warn',
        summary: 'Giriş Gerekli',
        detail: 'Sepete eklemek için giriş yapmanız gerekiyor.'
      });
      // Login sayfasına yönlendir
      setTimeout(() => {
        this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: this.router.url }
        });
      }, 1500);
      return;
    }

    // 2. Ürün bilgileri kontrolü
    if (!this.product || !this.product.id || !this.product.name || this.product.price === null || this.product.price === undefined) {
      this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Ürün bilgileri eksik.' });
      return;
    }

    // 3. BasketStateService ile sepete ekle
    this.basketStateService.addToBasket({
      id: this.product.id,
      name: this.product.name,
      price: this.product.price,
      imageUrl: this.product.pictureUrl || '',
      quantity: this.quantity
    });

    // 4. Modal'ı aç
    this.modalData = {
      productId: this.product.id,
      productName: this.product.name,
      productPrice: this.product.price,
      productImage: this.product.pictureUrl || '',
      addedQuantity: this.quantity
    };
    this.showAddToCartModal = true;

    console.log('Ürün sepete eklendi, modal açılıyor:', this.modalData);
  }

  onContinueShopping() {
    this.showAddToCartModal = false;
    // Ürün listesine dön
    this.router.navigate(['/shop']);
  }

  onGoToCart() {
    this.showAddToCartModal = false;
    // Sepet sayfasına git
    this.router.navigate(['/basket']);
  }

  getStockStatus(count: number): string {
    if (count === 0) return 'TÜKENDİ';
    if (count < 10) return `SON ${count} ÜRÜN`;
    return 'STOKTA';
  }

  getSeverity(count: number): "success" | "warning" | "danger" | undefined {
    if (count === 0) return 'danger';
    if (count < 10) return 'warning';
    return 'success';
  }
}
