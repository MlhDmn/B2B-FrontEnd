import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Inject, PLATFORM_ID } from '@angular/core';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { AuthService } from '../../services/auth.service';
import { getProductGenderLabel, Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-landing',
  imports: [],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  products = signal<Product[]>([]);
  errorMessage = signal('');
  isLoading = signal(true);
  isSidebarOpen = signal(false);

  readonly getProductGenderLabel = getProductGenderLabel;

  constructor(
    private readonly productService: ProductService,
    private readonly authService: AuthService,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadProducts();
  }

  loadProducts(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.productService.getProducts().pipe(
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe({
      next: products => {
        this.products.set(products);
      },
      error: error => {
        this.products.set([]);
        this.errorMessage.set(getApiErrorMessage(error, 'Products could not be loaded.'));
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(isOpen => !isOpen);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  }
}
