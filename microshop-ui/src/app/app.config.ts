import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeTr from '@angular/common/locales/tr';

import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth.interceptor';

import { ApiModule as IdentityApiModule, Configuration as IdentityConfig } from './api/identity';
import { ApiModule as StockApiModule, Configuration as StockConfig } from './api/stock';
import { ApiModule as BasketApiModule, Configuration as BasketConfig } from './api/basket';
import { ApiModule as OrderApiModule, Configuration as OrderConfig } from './api/order';
import { ApiModule as PaymentApiModule, Configuration as PaymentConfig } from './api/payment';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

const GATEWAY_URL = 'http://localhost:8080';
const ORDER_API_URL = 'http://localhost:5001';

// Türkçe locale'i kaydet
registerLocaleData(localeTr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    { provide: LOCALE_ID, useValue: 'tr' },

    importProvidersFrom(
         IdentityApiModule.forRoot(() => new IdentityConfig({
          basePath: GATEWAY_URL
          })),
          StockApiModule.forRoot(() => new StockConfig({ basePath: GATEWAY_URL })),
          BasketApiModule.forRoot(() => new BasketConfig({ basePath: GATEWAY_URL })),
          OrderApiModule.forRoot(() => new OrderConfig({ basePath: ORDER_API_URL })),
          PaymentApiModule.forRoot(() => new PaymentConfig({ basePath: GATEWAY_URL }))
        )
  ]
};
