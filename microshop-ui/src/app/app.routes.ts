import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { SellerLayoutComponent } from './layout/seller-layout/seller-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProductListComponent } from './features/shop/product-list/product-list.component';
import { BasketComponent } from './features/basket/basket/basket.component';
import { ProductDetailComponent } from './features/shop/product-detail/product-detail.component';
import { CheckoutComponent } from './features/payment/checkout/checkout.component';
import { SellerDashboardComponent } from './features/seller/dashboard/dashboard.component';
import { SellerProductsComponent } from './features/seller/products/products.component';
import { SellerCustomersComponent } from './features/seller/customers/customers.component';
import { SellerSettingsComponent } from './features/seller/settings/settings.component';

export const routes: Routes = [
  // 1. Auth Sayfaları (Navbar YOK)
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // 2. Ana Uygulama (Navbar VAR)
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'shop/product/:id', component: ProductDetailComponent }, // Ürün Detay (daha spesifik route önce)
      { path: 'shop', component: ProductListComponent }, // Vitrin
      { path: 'basket', component: BasketComponent },    // Sepet
      { path: 'checkout', component: CheckoutComponent }, // Ödeme
      { path: '', redirectTo: 'shop', pathMatch: 'full' }
    ]
  },

  // 3. Seller Panel (Ayrı Layout)
  {
    path: 'seller',
    component: SellerLayoutComponent,
    children: [
      { path: '', component: SellerDashboardComponent }, // Dashboard
      { path: 'products', component: SellerProductsComponent }, // Ürün Yönetimi
      { path: 'orders', loadComponent: () => import('./features/seller/orders/orders.component').then(m => m.SellerOrdersComponent) }, // Sipariş Yönetimi
      { path: 'sales', loadComponent: () => import('./features/seller/sales/sales.component').then(m => m.SellerSalesComponent) }, // Satış Raporları
      { path: 'customers', component: SellerCustomersComponent }, // Müşteri Yönetimi
      { path: 'settings', component: SellerSettingsComponent } // Ayarlar
    ]
  },

  // Hatalı URL -> Shop'a git
  { path: '**', redirectTo: 'shop' }
];
