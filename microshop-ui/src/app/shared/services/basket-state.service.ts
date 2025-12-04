import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, catchError, of } from 'rxjs';
import { BasketService, BasketItem as ApiBasketItem, ShoppingCart } from '../../api/basket';
import { AuthStateService } from './auth-state.service';

export interface BasketItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export interface BasketSummary {
  totalItems: number;
  totalPrice: number;
  items: BasketItem[];
}

@Injectable({
  providedIn: 'root'
})
export class BasketStateService {
  private readonly BASKET_KEY = 'microshop_basket';

  private basketItemsSubject = new BehaviorSubject<BasketItem[]>(this.loadBasketFromStorage());
  public basketItems$ = this.basketItemsSubject.asObservable();

  // Derived observables
  public basketSummary$: Observable<BasketSummary> = this.basketItems$.pipe(
    map(items => ({
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      items
    }))
  );

  public basketCount$ = this.basketSummary$.pipe(
    map(summary => summary.totalItems)
  );

  constructor(
    private basketApiService: BasketService,
    private authStateService: AuthStateService
  ) {
    console.log('BasketStateService başlatıldı');
    console.log('Başlangıç sepet içeriği:', this.basketItemsSubject.value);

    // User login durumu değiştiğinde sepet durumunu senkronize et
    this.authStateService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.syncBasketFromApi();
      } else {
        // Logout olduğunda local sepeti temizle
        this.updateBasket([]);
      }
    });
  }

  // Sepete ürün ekle
  addToBasket(product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    quantity?: number;
  }): void {
    console.log('Ürün sepete ekleniyor:', product);

    // Eğer kullanıcı login ise API'ye de ekle
    if (this.authStateService.isAuthenticated()) {
      const userId = this.authStateService.getCurrentUserId();
      if (userId) {
        const apiItem: ApiBasketItem = {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: product.quantity || 1,
          pictureUrl: product.imageUrl || ''
        };

        this.basketApiService.apiBasketUserIdItemsPost(userId, apiItem).subscribe({
          next: (response) => {
            console.log('API sepet güncellendi:', response);
            this.syncBasketFromApi();
          },
          error: (error) => {
            console.error('API sepet hatası:', error);
            // API hatası olursa sadece local sepete ekle
            this.addToLocalBasket(product);
          }
        });
      } else {
        this.addToLocalBasket(product);
      }
    } else {
      // Login değilse sadece local sepete ekle
      this.addToLocalBasket(product);
    }
  }

  private addToLocalBasket(product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    quantity?: number;
  }): void {
    const currentItems = this.basketItemsSubject.value;
    const existingItemIndex = currentItems.findIndex(item => item.productId === product.id);

    if (existingItemIndex > -1) {
      // Ürün zaten sepette, miktarı artır
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex].quantity += (product.quantity || 1);
      this.updateBasket(updatedItems);
    } else {
      // Yeni ürün ekle
      const newItem: BasketItem = {
        id: this.generateItemId(),
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: product.quantity || 1
      };

      const updatedItems = [...currentItems, newItem];
      this.updateBasket(updatedItems);
    }

    console.log('Ürün local sepete eklendi:', product);
  }

  // Sepetten ürün kaldır
  removeFromBasket(itemId: string): void {
    const currentItems = this.basketItemsSubject.value;
    const itemToRemove = currentItems.find(item => item.id === itemId);

    if (!itemToRemove) return;

    // Eğer kullanıcı login ise API'den de kaldır
    if (this.authStateService.isAuthenticated()) {
      const userId = this.authStateService.getCurrentUserId();
      if (userId) {
        this.basketApiService.apiBasketUserIdItemsProductIdDelete(userId, itemToRemove.productId).subscribe({
          next: () => {
            console.log('Ürün API sepetinden kaldırıldı:', itemToRemove.productId);
            this.removeFromLocalBasket(itemId);
          },
          error: (error) => {
            console.error('API sepet silme hatası:', error);
            // API hatası olursa sadece local sepetten kaldır
            this.removeFromLocalBasket(itemId);
          }
        });
      } else {
        this.removeFromLocalBasket(itemId);
      }
    } else {
      this.removeFromLocalBasket(itemId);
    }
  }

  private removeFromLocalBasket(itemId: string): void {
    const currentItems = this.basketItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    this.updateBasket(updatedItems);
    console.log('Ürün local sepetten kaldırıldı:', itemId);
  }

  // Ürün miktarını güncelle
  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromBasket(itemId);
      return;
    }

    const currentItems = this.basketItemsSubject.value;
    const itemToUpdate = currentItems.find(item => item.id === itemId);

    if (!itemToUpdate) return;

    // Eğer kullanıcı login ise API'yi de güncelle
    if (this.authStateService.isAuthenticated()) {
      const userId = this.authStateService.getCurrentUserId();
      if (userId) {
        const updatedApiItem: ApiBasketItem = {
          productId: itemToUpdate.productId,
          productName: itemToUpdate.name,
          price: itemToUpdate.price,
          quantity: quantity,
          pictureUrl: itemToUpdate.imageUrl || ''
        };

        this.basketApiService.apiBasketUserIdItemsPost(userId, updatedApiItem).subscribe({
          next: () => {
            console.log('API sepet miktarı güncellendi:', itemToUpdate.productId, quantity);
            this.updateLocalQuantity(itemId, quantity);
          },
          error: (error) => {
            console.error('API miktar güncelleme hatası:', error);
            // API hatası olursa sadece local sepeti güncelle
            this.updateLocalQuantity(itemId, quantity);
          }
        });
      } else {
        this.updateLocalQuantity(itemId, quantity);
      }
    } else {
      this.updateLocalQuantity(itemId, quantity);
    }
  }

  private updateLocalQuantity(itemId: string, quantity: number): void {
    const currentItems = this.basketItemsSubject.value;
    const updatedItems = currentItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    this.updateBasket(updatedItems);
    console.log('Local sepet miktarı güncellendi:', itemId, quantity);
  }

  // Sepeti temizle
  clearBasket(): void {
    // Eğer kullanıcı login ise API sepetini de temizle
    if (this.authStateService.isAuthenticated()) {
      const userId = this.authStateService.getCurrentUserId();
      if (userId) {
        this.basketApiService.apiBasketUserIdDelete(userId).subscribe({
          next: () => {
            console.log('API sepeti temizlendi');
            this.updateBasket([]);
          },
          error: (error) => {
            console.error('API sepet temizleme hatası:', error);
            // API hatası olursa sadece local sepeti temizle
            this.updateBasket([]);
          }
        });
      } else {
        this.updateBasket([]);
      }
    } else {
      this.updateBasket([]);
    }

    console.log('Sepet temizlendi');
  }

  // Belirli bir ürünün sepetteki miktarını getir
  getProductQuantityInBasket(productId: string): Observable<number> {
    return this.basketItems$.pipe(
      map(items => {
        const item = items.find(item => item.productId === productId);
        return item ? item.quantity : 0;
      })
    );
  }

  // Ürünün sepette olup olmadığını kontrol et
  isProductInBasket(productId: string): Observable<boolean> {
    return this.basketItems$.pipe(
      map(items => items.some(item => item.productId === productId))
    );
  }

  private updateBasket(items: BasketItem[]): void {
    this.basketItemsSubject.next(items);
    this.saveBasketToStorage(items);
  }

  private loadBasketFromStorage(): BasketItem[] {
    try {
      const basketData = localStorage.getItem(this.BASKET_KEY);
      if (basketData) {
        return JSON.parse(basketData);
      }
    } catch (error) {
      console.error('Sepet verileri yüklenirken hata:', error);
    }
    return [];
  }

  private saveBasketToStorage(items: BasketItem[]): void {
    try {
      localStorage.setItem(this.BASKET_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Sepet verileri kaydedilirken hata:', error);
    }
  }

  private generateItemId(): string {
    return 'basket_item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Sepet durumunu debug için
  getBasketState(): BasketItem[] {
    return this.basketItemsSubject.value;
  }

  // API'den sepet durumunu senkronize et
  private syncBasketFromApi(): void {
    const userId = this.authStateService.getCurrentUserId();
    if (!userId || userId === 'temp-id') {
      console.log('Geçerli user ID yok, API senkronizasyonu atlanıyor:', userId);
      return;
    }

    console.log('API sepet senkronizasyonu başlatılıyor, userId:', userId);

    this.basketApiService.apiBasketUserIdGet(userId).subscribe({
      next: (shoppingCart: ShoppingCart) => {
        console.log('API sepet verisi alındı:', shoppingCart);

        if (shoppingCart.items) {
          const basketItems: BasketItem[] = shoppingCart.items.map(apiItem => ({
            id: this.generateItemId(),
            productId: apiItem.productId || '',
            name: apiItem.productName || '',
            price: apiItem.price || 0,
            imageUrl: apiItem.pictureUrl || '',
            quantity: apiItem.quantity || 1
          }));

          this.updateBasket(basketItems);
        }
      },
      error: (error) => {
        console.error('API sepet senkronizasyon hatası:', error);
        // API hatası olursa local sepet kullanılmaya devam eder
      }
    });
  }
}
