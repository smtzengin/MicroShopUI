import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { AuthStateService, User } from '../../shared/services/auth-state.service';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MenuModule,
    ButtonModule,
    AvatarModule
  ],
  templateUrl: './seller-layout.component.html',
  styleUrl: './seller-layout.component.scss'
})
export class SellerLayoutComponent implements OnInit {
  menuItems: MenuItem[] = [];
  user: User | null = null;
  isSidebarCollapsed = false;

  constructor(
    private authStateService: AuthStateService,
    private router: Router
  ) {}

  ngOnInit() {
    // Kullanıcı bilgilerini al
    this.authStateService.currentUser$.subscribe(user => {
      this.user = user;
    });

    // Menu öğelerini oluştur
    this.menuItems = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/seller']
      },
      {
        label: 'Ürünlerim',
        icon: 'pi pi-box',
        routerLink: ['/seller/products']
      },
      {
        label: 'Siparişlerim',
        icon: 'pi pi-shopping-cart',
        routerLink: ['/seller/orders']
      },
      {
        label: 'Satışlarım',
        icon: 'pi pi-chart-line',
        routerLink: ['/seller/sales']
      },
      {
        label: 'Müşterilerim',
        icon: 'pi pi-users',
        routerLink: ['/seller/customers']
      },
      {
        separator: true
      },
      {
        label: 'Ayarlar',
        icon: 'pi pi-cog',
        routerLink: ['/seller/settings']
      },
      {
        label: 'Mağazaya Git',
        icon: 'pi pi-external-link',
        command: () => this.router.navigate(['/shop'])
      },
      {
        label: 'Çıkış Yap',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout() {
    this.authStateService.logout();
    this.router.navigate(['/auth/login']);
  }

  onMenuItemClick(item: MenuItem, event: Event) {
    if (item.command) {
      item.command({ originalEvent: event, item });
    }
  }
}
