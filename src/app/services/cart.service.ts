import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { map, tap } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';
import { Product } from './product.service';

export interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  stockQuantity: number;
  quantity: number;
}

interface CartResponse {
  id: number;
  userId: number;
  items: CartItemResponse[];
  totalQuantity: number;
  totalPrice: number;
}

interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockQuantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apiOrigin = 'http://localhost:5072';
  private readonly apiUrl = `${this.apiOrigin}/api/Cart`;
  private readonly itemsSignal = signal<CartItem[]>([]);

  readonly items = this.itemsSignal.asReadonly();

  constructor(private readonly http: HttpClient) {}

  loadCart() {
    return this.http.get<ApiResponse<CartResponse>>(this.apiUrl).pipe(
      map(response => this.mapCartResponse(
        unwrapApiResponse(response, 'Cart could not be loaded.')
      )),
      tap(items => {
        this.itemsSignal.set(items);
      })
    );
  }

  addProduct(product: Product) {
    return this.http.post<ApiResponse<CartResponse>>(`${this.apiUrl}/items`, {
      productId: product.id,
      quantity: 1
    }).pipe(
      map(response => this.mapCartResponse(
        unwrapApiResponse(response, 'Product could not be added to the cart.')
      )),
      tap(items => {
        this.itemsSignal.set(items);
      })
    );
  }

  setQuantity(item: CartItem, quantity: number) {
    const normalizedQuantity = Math.floor(quantity);

    if (normalizedQuantity <= 0) {
      return this.removeItem(item);
    }

    return this.http.put<ApiResponse<CartResponse>>(`${this.apiUrl}/items/${item.id}`, {
      quantity: normalizedQuantity
    }).pipe(
      map(response => this.mapCartResponse(
        unwrapApiResponse(response, 'Cart item could not be updated.')
      )),
      tap(items => {
        this.itemsSignal.set(items);
      })
    );
  }

  removeItem(item: CartItem) {
    return this.http.delete<ApiResponse<CartResponse>>(`${this.apiUrl}/items/${item.id}`).pipe(
      map(response => this.mapCartResponse(
        unwrapApiResponse(response, 'Cart item could not be removed.')
      )),
      tap(items => {
        this.itemsSignal.set(items);
      })
    );
  }

  clearCart() {
    return this.http.delete<ApiResponse<CartResponse>>(this.apiUrl).pipe(
      map(response => this.mapCartResponse(
        unwrapApiResponse(response, 'Cart could not be cleared.')
      )),
      tap(items => {
        this.itemsSignal.set(items);
      })
    );
  }

  totalItems(): number {
    return this.items().reduce((total, item) => total + item.quantity, 0);
  }

  subtotal(): number {
    return this.items().reduce((total, item) => total + item.price * item.quantity, 0);
  }

  private mapCartResponse(cart: CartResponse): CartItem[] {
    return cart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      price: item.unitPrice,
      imageUrl: this.normalizeProductImageUrl(item.imageUrl),
      stockQuantity: item.stockQuantity,
      quantity: item.quantity
    }));
  }

  private normalizeProductImageUrl(imageUrl: string): string {
    if (!imageUrl || imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `${this.apiOrigin}${imageUrl}`;
  }
}
