import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';


// PrimeNG Modülleri
import { DataViewModule } from 'primeng/dataview';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { SliderModule } from 'primeng/slider'; // Fiyat aralığı için
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Category, Product, StockService } from '../../../api/stock';
import { BasketItem, BasketService } from '../../../api/basket';
import { AuthService } from '../../../api/identity';
import { AuthStateService } from '../../../shared/services/auth-state.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataViewModule, ButtonModule, DropdownModule,
    InputTextModule, RatingModule, TagModule, PaginatorModule, SliderModule,
    CheckboxModule, ToastModule, DividerModule,RadioButtonModule
  ],
  providers: [MessageService],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  // Veri
  products: Product[] = [];
  categories: Category[] = [];

  // Sayfalama
  totalRecords: number = 0;
  first: number = 0; // Paginator'ın başlangıç indeksi
  rows: number = 18;  // Sayfa başına ürün sayısı (Grid için 3x6 ideal)
  showAllProducts: boolean = false; // Tüm ürünleri göster seçeneği

  // Filtreler
  searchText: string = '';
  selectedCategoryId: number | undefined = undefined;
  priceRange: number[] = [0, 100000]; // Slider için (Min-Max)
  minPriceFilter: number | undefined = undefined;
  maxPriceFilter: number | undefined = undefined;

  // UI Durumu
  loading: boolean = true;
  layout: 'grid' | 'list' = 'grid'; // Görünüm modu
  useDataView: boolean = false; // DataView vs Simple Grid toggle (Simple Grid çalışıyor)

  constructor(
    private stockService: StockService,
    private basketService: BasketService,
    private messageService: MessageService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authStateService: AuthStateService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  // Kategorileri Çek (Dropdown için)
  loadCategories() {
    this.stockService.apiStockCategoriesGet().subscribe(res => {
      this.categories = res || [];
    });
  }

  // Ürünleri Çek (Filtreli ve Sayfalı)
  loadProducts() {
    this.loading = true;
    console.log('loadProducts çağrıldı');

    const pageNumber = this.showAllProducts ? 1 : (this.first / this.rows) + 1;
    const pageSize = this.showAllProducts ? 1000 : this.rows;

    console.log('Stock API parametreleri:', {
      pageNumber,
      pageSize,
      searchText: this.searchText,
      categoryId: this.selectedCategoryId,
      minPrice: this.minPriceFilter,
      maxPrice: this.maxPriceFilter
    });

    this.stockService.apiStockGet(
      pageNumber,
      pageSize,
      this.searchText || undefined,
      this.selectedCategoryId,
      this.minPriceFilter,
      this.maxPriceFilter,
      undefined,
      true // Sadece onaylılar
    ).subscribe({
      next: (res) => {
        console.log('Stock API response:', res);
        this.products = res.data || [];
        this.totalRecords = res.totalRecords || 0;
        this.loading = false;

        console.log('Yüklenen ürün sayısı:', this.products.length);
        console.log('Toplam kayıt sayısı:', this.totalRecords);

        // Change detection'ı zorlayalım
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        console.error('Stock API Hatası:', err);
        this.messageService.add({severity: 'error', summary: 'Hata', detail: 'Ürünler yüklenemedi.'});
      }
    });
  }  // Sayfa Değişince
  onPageChange(event: any) {
    if (this.showAllProducts) return; // Tüm ürünler gösteriliyorsa sayfa değişimi yok

    this.first = event.first;
    this.rows = event.rows;
    this.loadProducts();
  }

  // Filtreleme Tetikleyicisi
  onFilterChange() {
    this.first = 0; // Filtre değişince ilk sayfaya dön
    this.loadProducts();
  }

  // Fiyat Slider Değişince
  onPriceChange(event: any) {
    this.minPriceFilter = event.values[0];
    this.maxPriceFilter = event.values[1];
  }

  // Sepete Ekle
  addToBasket(product: Product) {
    // 1. Authentication kontrolü
    if (!this.authStateService.isAuthenticated()) {
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

    // 2. User ID'yi auth service'den al
    const userId = this.authStateService.getCurrentUserId();
    if (!userId) {
      this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Kullanıcı bilgisi bulunamadı.' });
      return;
    }

    // 3. Ürün bilgileri kontrolü
    if (!product.id || !product.name || product.price === null || product.price === undefined) {
      this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Ürün bilgileri eksik.' });
      return;
    }

    // 4. Sepet item'ını oluştur
    const item: BasketItem = {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: 1,
      pictureUrl: product.pictureUrl || ''
    };

    // 5. Sepete ekle
    this.basketService.apiBasketUserIdItemsPost(userId, item).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eklendi',
          detail: `${product.name} sepete eklendi!`
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Hata', detail: 'Sepete eklenemedi.' });
      }
    });
  }

  // Stok Durumu Etiketi (Yardımcı Fonksiyon)
  getSeverity(product: Product): "success" | "warning" | "danger" | undefined {
    if (!product.stockCount) return 'danger';
    if (product.stockCount > 10) return 'success';
    if (product.stockCount > 0) return 'warning';
    return 'danger';
  }

  // TrackBy fonksiyonu (Performans için)
  trackByProductId(index: number, product: Product): any {
    return product.id;
  }

  // Ürün detay sayfasına git
  navigateToDetail(product: Product) {
    if (product.id) {
      this.router.navigate(['/shop/product', product.id]);
    }
  }
}
