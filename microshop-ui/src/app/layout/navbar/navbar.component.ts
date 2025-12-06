import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router'; // RouterLink için
import { CommonModule } from '@angular/common'; // Genel direktifler
import { Observable } from 'rxjs';

// --- EKSİK OLAN IMPORTLAR ---
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthStateService, User } from '../../shared/services/auth-state.service';
import { BasketStateService } from '../../shared/services/basket-state.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MenubarModule, ButtonModule, BadgeModule, AvatarModule, TooltipModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  items: MenuItem[] = [
    { label: 'Mağaza', icon: 'pi pi-home', routerLink: '/shop' },
    { label: 'Kategoriler', icon: 'pi pi-list', items: [
        { label: 'Elektronik' },
        { label: 'Giyim' }
      ]
    }
  ];

  isLoggedIn$!: Observable<boolean>;
  currentUser$!: Observable<User | null>;
  basketCount$!: Observable<number>;

  constructor(
    private authStateService: AuthStateService,
    private basketStateService: BasketStateService
  ) {}

  ngOnInit() {
    this.isLoggedIn$ = this.authStateService.isLoggedIn$;
    this.currentUser$ = this.authStateService.currentUser$;
    this.basketCount$ = this.basketStateService.basketCount$;

    // Debug için
    this.isLoggedIn$.subscribe(isLoggedIn => {
      console.log('Navbar - Login durumu değişti:', isLoggedIn);
    });

    this.currentUser$.subscribe(user => {
      console.log('Navbar - User değişti:', user);
    });

    this.basketCount$.subscribe(count => {
      console.log('Navbar - Sepet sayısı değişti:', count);
    });
  }

  logout() {
    this.authStateService.logout();
  }

  // Role kontrolü için yardımcı method
  isSeller(): boolean {
    return this.authStateService.isSeller();
  }

  isCustomer(): boolean {
    return this.authStateService.isCustomer();
  }
}

