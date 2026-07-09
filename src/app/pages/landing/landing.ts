import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { AuthService } from '../../services/auth.service';
import { getProductGenderLabel, Product, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  readonly pageSize = 20;

  products = signal<Product[]>([]);
  currentPage = signal(1);
  totalCount = signal(0);
  totalPageCount = signal(1);
  hasPreviousPage = signal(false);
  hasNextPage = signal(false);
  errorMessage = signal('');
  isLoading = signal(true);
  isSidebarOpen = signal(false);
  selectedProduct = signal<Product | null>(null);

  readonly getProductGenderLabel = getProductGenderLabel;

  constructor(
    private readonly productService: ProductService,
    private readonly authService: AuthService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadProducts(1);
  }

  loadProducts(pageNumber = this.currentPage()): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.productService.getProducts(pageNumber, this.pageSize).pipe(
      finalize(() => {
        this.isLoading.set(false);
      })
    ).subscribe({
      next: page => {
        this.products.set(page.items);
        this.currentPage.set(page.pageNumber);
        this.totalCount.set(page.totalCount);
        this.totalPageCount.set(Math.max(page.totalPages, 1));
        this.hasPreviousPage.set(page.hasPreviousPage);
        this.hasNextPage.set(page.hasNextPage);
      },
      error: error => {
        this.products.set([]);
        this.currentPage.set(1);
        this.totalCount.set(0);
        this.totalPageCount.set(1);
        this.hasPreviousPage.set(false);
        this.hasNextPage.set(false);
        this.errorMessage.set(getApiErrorMessage(error, 'Products could not be loaded.'));
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.closeSidebar();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(isOpen => !isOpen);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  openProductDetails(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeProductDetails(): void {
    this.selectedProduct.set(null);
  }

  canAccessAdminPanel(): boolean {
    return this.authService.canAccessAdminPanel();
  }

  totalPages(): number {
    return this.totalPageCount();
  }

  pageNumbers(): number[] {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  }

  pageStart(): number {
    if (this.totalCount() === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  pageEnd(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalCount());
  }

  goToPage(page: number): void {
    const nextPage = Math.min(Math.max(page, 1), this.totalPages());

    if (nextPage === this.currentPage()) {
      return;
    }

    this.loadProducts(nextPage);
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages());
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  }
}
