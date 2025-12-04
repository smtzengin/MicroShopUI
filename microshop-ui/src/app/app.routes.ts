import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProductListComponent } from './features/shop/product-list/product-list.component';
import { BasketComponent } from './features/basket/basket/basket.component';
import { ProductDetailComponent } from './features/shop/product-detail/product-detail.component';

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
      { path: '', redirectTo: 'shop', pathMatch: 'full' }
    ]
  },

  // Hatalı URL -> Shop'a git
  { path: '**', redirectTo: 'shop' }
];
