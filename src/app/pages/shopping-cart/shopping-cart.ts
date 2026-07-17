import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { CartItem, CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-shopping-cart',
  imports: [RouterLink],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.css',
})
export class ShoppingCart implements OnInit {
  private readonly fallbackProductImageUrl = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 640 420%22%3E%3Crect width=%22640%22 height=%22420%22 fill=%22%23e0f7ff%22/%3E%3Cpath d=%22M130 304l114-126 84 92 54-60 128 94H130z%22 fill=%22%23bae6fd%22/%3E%3Ccircle cx=%22442%22 cy=%22130%22 r=%2238%22 fill=%22%230284c7%22 opacity=%22.45%22/%3E%3Ctext x=%22320%22 y=%22358%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2228%22 font-weight=%22700%22 fill=%22%2324527a%22%3EImage unavailable%3C/text%3E%3C/svg%3E';
  isLoading = signal(true);
  isCheckingOut = signal(false);
  errorMessage = signal('');

  constructor(
    private readonly cartService: CartService,
    private readonly productService: ProductService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.cartService.loadCart().pipe(
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe({
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Cart could not be loaded.'));
      }
    });
  }

  cartItems(): CartItem[] {
    return this.cartService.items();
  }

  totalItems(): number {
    return this.cartService.totalItems();
  }

  subtotal(): number {
    return this.cartService.subtotal();
  }

  increaseQuantity(item: CartItem): void {
    this.updateCartItemQuantity(item, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem): void {
    this.updateCartItemQuantity(item, item.quantity - 1);
  }

  updateQuantity(item: CartItem, value: string): void {
    this.updateCartItemQuantity(item, Number(value) || 1);
  }

  removeItem(item: CartItem): void {
    this.errorMessage.set('');
    this.cartService.removeItem(item).subscribe({
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Cart item could not be removed.'));
      }
    });
  }

  clearCart(): void {
    this.errorMessage.set('');
    this.cartService.clearCart().subscribe({
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Cart could not be cleared.'));
      }
    });
  }

  finishShopping(): void {
    const items = this.cartItems();

    if (items.length === 0 || this.isCheckingOut()) {
      return;
    }

    this.errorMessage.set('');
    this.isCheckingOut.set(true);

    forkJoin(items.map(item => this.validateCheckoutItem(item))).pipe(
      finalize(() => {
        this.isCheckingOut.set(false);
      })
    ).subscribe({
      next: validationResults => {
        const reasons = validationResults.filter(
          (reason): reason is string => reason !== null
        );

        if (reasons.length > 0) {
          this.router.navigate(['/checkout/failure'], {
            state: { reasons }
          });
          return;
        }

        this.router.navigate(['/checkout/success']);
      },
      error: error => {
        this.errorMessage.set(
          getApiErrorMessage(error, 'Products could not be checked before checkout.')
        );
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  }

  handleProductImageError(event: Event): void {
    const image = event.target as HTMLImageElement;

    if (image.src === this.fallbackProductImageUrl) {
      return;
    }

    image.src = this.fallbackProductImageUrl;
  }

  private updateCartItemQuantity(item: CartItem, quantity: number): void {
    this.errorMessage.set('');
    this.cartService.setQuantity(item, quantity).subscribe({
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Cart item could not be updated.'));
      }
    });
  }

  private validateCheckoutItem(item: CartItem): Observable<string | null> {
    return this.productService.getProduct(item.productId).pipe(
      map(product => {
        if (!product.isActive) {
          return `${item.name} is no longer available.`;
        }

        if (product.stockQuantity <= 0) {
          return `${item.name} is out of stock.`;
        }

        if (item.quantity > product.stockQuantity) {
          return `${item.name} only has ${product.stockQuantity} item(s) available, but your cart contains ${item.quantity}.`;
        }

        return null;
      }),
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(`${item.name} was deleted and is no longer available.`);
        }

        return throwError(() => error);
      })
    );
  }
}
