import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { SellerService } from '../../../api/order';
import { StockService } from '../../../api/stock';
import { AuthStateService } from '../../../shared/services/auth-state.service';

interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockProducts: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  status: 'active' | 'inactive' | 'low-stock';
}

interface Order {
  id: string;
  customerName: string;
  productName: string;
  quantity: number;
  amount: number;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ChartModule,
    DividerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class SellerDashboardComponent implements OnInit {
  salesSummary: SalesSummary = {
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: 0
  };

  products: Product[] = [];
  recentOrders: Order[] = [];
  salesChartData: any;
  salesChartOptions: any;
  loading = true;

  constructor(
    private sellerService: SellerService,
    private stockService: StockService,
    private authStateService: AuthStateService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    this.initSalesChart();
  }

  loadDashboardData() {
    this.loading = true;

    // Seller istatistiklerini yükle
    this.loadSellerStats();

    // Seller'ın ürünlerini yükle
    this.loadSellerProducts();
  }

  loadSellerStats() {
    this.sellerService.apiSellerStatsGet().subscribe({
      next: (stats: any) => {
        console.log('Seller stats:', stats);
        this.salesSummary = {
          totalSales: stats?.totalSales || 0,
          totalRevenue: stats?.totalRevenue || 0,
          totalProducts: stats?.totalProducts || 0,
          lowStockProducts: stats?.lowStockProducts || 0
        };
      },
      error: (error) => {
        console.error('Seller stats yüklenirken hata:', error);
        // Fallback veriler (geliştirme için)
        this.salesSummary = {
          totalSales: 1247,
          totalRevenue: 45690,
          totalProducts: 23,
          lowStockProducts: 3
        };
      }
    });
  }

  loadSellerProducts() {
    const sellerId = this.authStateService.getCurrentUserId();
    if (!sellerId) {
      console.error('Seller ID bulunamadı');
      this.loading = false;
      return;
    }

    this.stockService.apiStockGet(1, 10, undefined, undefined, undefined, undefined, sellerId, undefined).subscribe({
      next: (response) => {
        console.log('Seller products:', response);
        this.products = response.data?.map(product => ({
          id: product.id || '',
          name: product.name || '',
          category: product.category?.name || 'Kategori Yok',
          price: product.price || 0,
          stock: product.stockCount || 0,
          sold: 0,
          status: this.getProductStatusFromApi(product.status, product.stockCount || 0)
        })) || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Ürünler yüklenirken hata:', error);
        this.loading = false;
        this.loadFallbackProducts();
      }
    });
  }

  getProductStatusFromApi(apiStatus: any, stockCount: number): 'active' | 'inactive' | 'low-stock' {
    if (stockCount === 0) return 'inactive';
    if (stockCount <= 5) return 'low-stock';
    return 'active';
  }

  loadFallbackProducts() {
    // Geliştirme için fallback data
    this.products = [
      {
        id: '1',
        name: 'iPhone 15 Pro',
        category: 'Elektronik',
        price: 45000,
        stock: 5,
        sold: 125,
        status: 'low-stock'
      },
      {
        id: '2',
        name: 'MacBook Air M2',
        category: 'Bilgisayar',
        price: 35000,
        stock: 12,
        sold: 89,
        status: 'active'
      }
    ];

    this.recentOrders = [
      {
        id: 'ORD-001',
        customerName: 'Ahmet Yılmaz',
        productName: 'iPhone 15 Pro',
        quantity: 1,
        amount: 45000,
        date: new Date('2024-12-05'),
        status: 'completed'
      }
    ];
  }

  initSalesChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.salesChartData = {
      labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
      datasets: [
        {
          label: 'Satış Miktarı',
          data: [65, 59, 80, 81, 56, 89, 95, 123, 145, 167, 134, 187],
          fill: false,
          borderColor: documentStyle.getPropertyValue('--primary-color'),
          backgroundColor: documentStyle.getPropertyValue('--primary-color'),
          tension: 0.4
        }
      ]
    };

    this.salesChartOptions = {
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        }
      }
    };
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

  getOrderStatusSeverity(status: string): any {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return null;
    }
  }

  getOrderStatusLabel(status: string): string {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'pending':
        return 'Beklemede';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  }
}
