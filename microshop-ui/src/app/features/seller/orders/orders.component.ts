import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SellerService } from '../../../api/order';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  items: OrderItem[];
}

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="seller-orders p-4">
      <p-toast></p-toast>

      <div class="flex justify-content-between align-items-center mb-4">
        <h2 class="text-2xl font-bold text-900 mb-0">Sipariş Yönetimi</h2>
        <div class="flex gap-2">
          <p-button label="Yenile" icon="pi pi-refresh" severity="info" [outlined]="true" (onClick)="loadOrders()"></p-button>
          <p-button label="Dışa Aktar" icon="pi pi-download" severity="secondary" [outlined]="true"></p-button>
        </div>
      </div>

      <p-card>
        <p-table [value]="orders" [paginator]="true" [rows]="10" styleClass="p-datatable-striped">
          <ng-template pTemplate="header">
            <tr>
              <th>Sipariş No</th>
              <th>Müşteri</th>
              <th>Tarih</th>
              <th>Toplam</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-order>
            <tr>
              <td class="font-semibold text-primary">{{ order.id }}</td>
              <td>
                <div>{{ order.customerName }}</div>
                <small class="text-600">{{ order.customerEmail }}</small>
              </td>
              <td>{{ order.orderDate | date:'short':'tr' }}</td>
              <td class="font-semibold">₺{{ order.total | number:'1.0-0':'tr' }}</td>
              <td>
                <p-tag [value]="getOrderStatusLabel(order.status)" [severity]="getOrderStatusSeverity(order.status)"></p-tag>
              </td>
              <td>
                <div class="flex gap-1">
                  <p-button icon="pi pi-eye" severity="info" [text]="true" size="small" pTooltip="Detay" (onClick)="viewOrder(order)"></p-button>
                  <p-button icon="pi pi-pencil" severity="warning" [text]="true" size="small" pTooltip="Durum Güncelle" (onClick)="updateOrderStatus(order)"></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>

      <!-- Order Detail Dialog -->
      <p-dialog [(visible)]="orderDetailVisible" [header]="'Sipariş Detayı - ' + selectedOrder?.id" [modal]="true" [closable]="true" [style]="{ width: '700px' }">
        <div *ngIf="selectedOrder">
          <div class="grid">
            <div class="col-6">
              <h4>Müşteri Bilgileri</h4>
              <p><strong>Ad:</strong> {{ selectedOrder.customerName }}</p>
              <p><strong>E-posta:</strong> {{ selectedOrder.customerEmail }}</p>
            </div>
            <div class="col-6">
              <h4>Sipariş Bilgileri</h4>
              <p><strong>Tarih:</strong> {{ selectedOrder.orderDate | date:'short':'tr' }}</p>
              <p><strong>Durum:</strong> <p-tag [value]="getOrderStatusLabel(selectedOrder.status)" [severity]="getOrderStatusSeverity(selectedOrder.status)"></p-tag></p>
            </div>
          </div>

          <h4>Ürünler</h4>
          <p-table [value]="selectedOrder.items" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Ürün</th>
                <th>Adet</th>
                <th>Birim Fiyat</th>
                <th>Toplam</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td>{{ item.productName }}</td>
                <td>{{ item.quantity }}</td>
                <td>₺{{ item.price | number:'1.0-0':'tr' }}</td>
                <td>₺{{ item.total | number:'1.0-0':'tr' }}</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </p-dialog>

      <!-- Status Update Dialog -->
      <p-dialog [(visible)]="statusUpdateVisible" header="Sipariş Durumu Güncelle" [modal]="true" [closable]="true" [style]="{ width: '400px' }">
        <div *ngIf="selectedOrder" class="flex flex-column gap-3">
          <div>
            <label class="block mb-2">Yeni Durum</label>
            <p-dropdown [(ngModel)]="newStatus" [options]="statusOptions" optionLabel="label" optionValue="value" class="w-full"></p-dropdown>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <div class="flex justify-content-end gap-2">
            <p-button label="İptal" severity="secondary" (onClick)="statusUpdateVisible = false"></p-button>
            <p-button label="Güncelle" (onClick)="saveStatusUpdate()"></p-button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .seller-orders {
      .p-datatable .p-datatable-tbody > tr > td {
        padding: 1rem 0.75rem;
      }
    }
  `]
})
export class SellerOrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  statusOptions = [
    { label: 'Beklemede', value: 'pending' },
    { label: 'İşleniyor', value: 'processing' },
    { label: 'Kargoda', value: 'shipped' },
    { label: 'Teslim Edildi', value: 'delivered' },
    { label: 'İptal Edildi', value: 'cancelled' }
  ];

  selectedOrder: Order | null = null;
  orderDetailVisible = false;
  statusUpdateVisible = false;
  newStatus = '';

  constructor(
    private sellerService: SellerService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;

    setTimeout(() => {
      this.orders = [];
      this.loading = false;
      this.messageService.add({
        severity: 'info',
        summary: 'Bilgi',
        detail: 'Sipariş servisi henüz aktif değil. Gerçek siparişler API hazır olduğunda görüntülenecek.'
      });
    }, 1000);
  }



  viewOrder(order: Order) {
    this.selectedOrder = order;
    this.orderDetailVisible = true;
  }

  updateOrderStatus(order: Order) {
    this.selectedOrder = order;
    this.newStatus = order.status;
    this.statusUpdateVisible = true;
  }

  saveStatusUpdate() {
    if (this.selectedOrder && this.newStatus) {
      this.selectedOrder.status = this.newStatus as any;
      this.statusUpdateVisible = false;

      this.messageService.add({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Sipariş durumu güncellendi.'
      });
    }
  }

  getOrderStatusSeverity(status: string): any {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'danger';
      default: return null;
    }
  }

  getOrderStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Beklemede';
      case 'processing': return 'İşleniyor';
      case 'shipped': return 'Kargoda';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  }
}
