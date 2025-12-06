import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-seller-customers',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">Müşteri Yönetimi</h2>
      <p-card>
        <p class="text-center text-600">Müşteri yönetimi özellikleri yakında eklenecek...</p>
      </p-card>
    </div>
  `
})
export class SellerCustomersComponent {}
