import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-seller-sales',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">Satış Raporları</h2>
      <p-card>
        <p class="text-center text-600">Satış raporları yakında eklenecek...</p>
      </p-card>
    </div>
  `
})
export class SellerSalesComponent {}
