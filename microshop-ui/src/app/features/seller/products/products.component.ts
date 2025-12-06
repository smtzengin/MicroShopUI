import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { StockService, Product as ApiProduct, Category as ApiCategory } from '../../../api/stock';
import { AuthStateService } from '../../../shared/services/auth-state.service';

interface Product {
  id?: string;
  name: string;
  description: string;
  category: string;
  categoryId?: number;
  price: number;
  stock: number;
  sold: number;
  image?: string;
  status: 'active' | 'inactive' | 'low-stock';
  createdDate: Date;
}

interface Category {
  label: string;
  value: number;
}

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToolbarModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    DropdownModule,
    FileUploadModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class SellerProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];

  productDialog = false;
  productForm: FormGroup;
  selectedProduct: Product | null = null;
  submitted = false;
  loading = true;

  constructor(
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private stockService: StockService,
    private authStateService: AuthStateService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      categoryId: [null, Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      stock: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.stockService.apiStockCategoriesGet().subscribe({
      next: (categories: ApiCategory[]) => {
        this.categories = categories.map(cat => ({
          label: cat.name || 'İsimsiz Kategori',
          value: cat.id || 0
        }));
      },
      error: (error) => {
        console.error('Kategoriler yüklenirken hata:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Hata',
          detail: 'Kategoriler yüklenemedi.'
        });
      }
    });
  }

  loadProducts() {
    const sellerId = this.authStateService.getCurrentUserId();
    if (!sellerId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'Kullanıcı bilgisi bulunamadı.'
      });
      this.loading = false;
      return;
    }

    this.loading = true;
    this.stockService.apiStockGet(undefined, undefined, undefined, undefined, undefined, undefined, sellerId, undefined).subscribe({
      next: (response) => {
        console.log('Products loaded:', response);
        this.products = response.data?.map(this.mapApiProductToLocal.bind(this)) || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Ürünler yüklenirken hata:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Hata',
          detail: 'Ürünler yüklenemedi.'
        });
      }
    });
  }

  mapApiProductToLocal(apiProduct: ApiProduct): Product {
    return {
      id: apiProduct.id,
      name: apiProduct.name || '',
      description: apiProduct.description || '',
      category: apiProduct.category?.name || 'Kategori Yok',
      categoryId: apiProduct.categoryId,
      price: apiProduct.price || 0,
      stock: apiProduct.stockCount || 0,
      sold: 0,
      status: this.getProductStatusFromApi(apiProduct.stockCount || 0),
      createdDate: apiProduct.createdAt ? new Date(apiProduct.createdAt) : new Date()
    };
  }

  getProductStatusFromApi(stockCount: number): 'active' | 'inactive' | 'low-stock' {
    if (stockCount === 0) return 'inactive';
    if (stockCount <= 5) return 'low-stock';
    return 'active';
  }

  openNew() {
    this.selectedProduct = null;
    this.submitted = false;
    this.productForm.reset();
    this.productDialog = true;
  }

  editProduct(product: Product) {
    this.selectedProduct = { ...product };
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      price: product.price,
      stock: product.stock
    });
    this.productDialog = true;
  }

  deleteProduct(product: Product) {
    this.confirmationService.confirm({
      message: `${product.name} ürünini silmek istediğinizden emin misiniz?`,
      header: 'Ürün Sil',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.products = this.products.filter(p => p.id !== product.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Başarılı',
          detail: 'Ürün silindi.'
        });
      }
    });
  }

  hideDialog() {
    this.productDialog = false;
    this.submitted = false;
  }

  saveProduct() {
    this.submitted = true;

    if (this.productForm.valid) {
      const formValue = this.productForm.value;
      const sellerId = this.authStateService.getCurrentUserId();

      if (!sellerId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Hata',
          detail: 'Kullanıcı bilgisi bulunamadı.'
        });
        return;
      }

      const productData: any = {
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
        stockCount: formValue.stock,
        categoryId: formValue.categoryId,
        sellerId: sellerId
      };

      this.loading = true;

      if (this.selectedProduct) {
        // Update existing product
        console.log('Ürün güncelleme:', productData);

        setTimeout(() => {
          const index = this.products.findIndex(p => p.id === this.selectedProduct?.id);
          if (index !== -1) {
            this.products[index] = {
              ...this.products[index],
              ...productData,
              status: this.getProductStatus(productData.stockCount)
            };
          }
          this.loading = false;
          this.hideDialog();
          this.messageService.add({
            severity: 'success',
            summary: 'Başarılı',
            detail: 'Ürün başarıyla güncellendi.'
          });
        }, 1000);
      } else {
        // Add new product
        console.log('Yeni ürün ekleme:', productData);

        setTimeout(() => {
          const maxId = this.products.length > 0 ?
            Math.max(...this.products.map(p => {
              const id = parseInt(p.id?.toString() || '0');
              return isNaN(id) ? 0 : id;
            })) : 0;

          const newProduct = {
            id: maxId + 1,
            ...productData,
            status: this.getProductStatus(productData.stockCount),
            createdDate: new Date().toISOString().split('T')[0]
          };
          this.products = [newProduct, ...this.products];
          this.loading = false;
          this.hideDialog();
          this.messageService.add({
            severity: 'success',
            summary: 'Başarılı',
            detail: 'Yeni ürün başarıyla eklendi.'
          });
        }, 1000);
      }
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'Lütfen tüm zorunlu alanları doldurun.'
      });
    }
  }  getProductStatus(stock: number): 'active' | 'inactive' | 'low-stock' {
    if (stock === 0) return 'inactive';
    if (stock <= 5) return 'low-stock';
    return 'active';
  }

  getProductStatusSeverity(status: string): any {
    switch (status) {
      case 'active':
        return 'success';
      case 'low-stock':
        return 'warning';
      case 'inactive':
        return 'danger';
      default:
        return null;
    }
  }

  getProductStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'low-stock':
        return 'Stok Az';
      case 'inactive':
        return 'Stokta Yok';
      default:
        return status;
    }
  }

  onImageUpload(event: any) {
    const file = event.files[0];
    if (file) {
      // Bu kısımda normalde dosyayı sunucuya yükler ve URL'sini alırsınız
      console.log('Dosya yüklendi:', file.name);
      this.messageService.add({
        severity: 'info',
        summary: 'Bilgi',
        detail: 'Dosya yükleme özelliği yakında aktif olacak.'
      });
    }
  }

  exportProducts() {
    // Ürünleri export etme işlemi
    this.messageService.add({
      severity: 'info',
      summary: 'Bilgi',
      detail: 'Export özelliği yakında eklenecek.'
    });
  }

  importProducts() {
    // Ürünleri import etme işlemi
    this.messageService.add({
      severity: 'info',
      summary: 'Bilgi',
      detail: 'Import özelliği yakında eklenecek.'
    });
  }
}
