import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';

// Otomatik üretilen Config sınıfları (API Klasöründen import et)
import { ApiModule as IdentityApiModule, Configuration as IdentityConfig } from './api/identity';
import { ApiModule as StockApiModule, Configuration as StockConfig } from './api/stock';
import { ApiModule as BasketApiModule, Configuration as BasketConfig } from './api/basket';
import { ApiModule as OrderApiModule, Configuration as OrderConfig } from './api/order';
import { ApiModule as PaymentApiModule, Configuration as PaymentConfig } from './api/payment';

// Gateway Adresi
const GATEWAY_URL = 'http://localhost:8080';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(), // PrimeNG animasyonları için
    provideHttpClient(withFetch()), // Modern fetch API kullan

    importProvidersFrom(
      IdentityApiModule.forRoot(() => new IdentityConfig({ basePath: GATEWAY_URL })),
      StockApiModule.forRoot(() => new StockConfig({ basePath: GATEWAY_URL })),
      BasketApiModule.forRoot(() => new BasketConfig({ basePath: GATEWAY_URL })),
      OrderApiModule.forRoot(() => new OrderConfig({ basePath: GATEWAY_URL })),
      PaymentApiModule.forRoot(() => new PaymentConfig({ basePath: GATEWAY_URL }))
    )
  ]
};
