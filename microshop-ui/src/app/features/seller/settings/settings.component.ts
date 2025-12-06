import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-seller-settings',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">Ayarlar</h2>
      <p-card>
        <p class="text-center text-600">Ayarlar sayfası yakında eklenecek...</p>
      </p-card>
    </div>
  `
})
export class SellerSettingsComponent {}
