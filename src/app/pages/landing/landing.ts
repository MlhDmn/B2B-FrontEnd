import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { AuthService, UserPermission } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Category, CategoryService } from '../../services/category.service';
import {
  getProductGenderLabel,
  Product,
  ProductGender,
  ProductListFilters,
  ProductSortOption,
  ProductService
} from '../../services/product.service';

@Component({
  selector: 'app-landing',
  imports: [FormsModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit {
  readonly pageSize = 20;
  private readonly fallbackProductImageUrl = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 640 420%22%3E%3Crect width=%22640%22 height=%22420%22 fill=%22%23e0f7ff%22/%3E%3Cpath d=%22M130 304l114-126 84 92 54-60 128 94H130z%22 fill=%22%23bae6fd%22/%3E%3Ccircle cx=%22442%22 cy=%22130%22 r=%2238%22 fill=%22%230284c7%22 opacity=%22.45%22/%3E%3Ctext x=%22320%22 y=%22358%22 text-anchor=%22middle%22 font-family=%22Arial,sans-serif%22 font-size=%2228%22 font-weight=%22700%22 fill=%22%2324527a%22%3EImage unavailable%3C/text%3E%3C/svg%3E';

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
  cartMessage = signal('');
  isLoadingCategories = signal(false);
  modalCategoryOptions = signal<Category[]>([]);
  searchTerm = signal('');
  filterCategoryId = signal('');
  filterGender = signal('');
  filterMinPrice = signal('');
  filterMaxPrice = signal('');
  filterInStockOnly = signal(false);
  sortBy = signal<ProductSortOption>('nameAsc');

  readonly genderOptions = [
    ProductGender.Unisex,
    ProductGender.Men,
    ProductGender.Women,
    ProductGender.Kids
  ];
  readonly sortOptions: Array<{ value: ProductSortOption; label: string }> = [
    { value: 'nameAsc', label: 'A to Z' },
    { value: 'nameDesc', label: 'Z to A' },
    { value: 'priceAsc', label: 'Price: low to high' },
    { value: 'priceDesc', label: 'Price: high to low' }
  ];

  readonly getProductGenderLabel = getProductGenderLabel;

  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadProducts(1);
    this.loadModalCategories();
    this.cartService.loadCart().subscribe({
      error: () => {
        this.cartMessage.set('');
      }
    });
  }

  loadProducts(pageNumber = this.currentPage()): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.productService.getProducts(pageNumber, this.pageSize, this.productFilters()).pipe(
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
    this.cartMessage.set('');
  }

  closeProductDetails(): void {
    this.selectedProduct.set(null);
    this.cartMessage.set('');
  }

  addProductToCart(product: Product): void {
    if (product.stockQuantity <= 0) {
      this.cartMessage.set(`${product.name} is out of stock.`);
      return;
    }

    this.cartService.addProduct(product).subscribe({
      next: () => {
        this.cartMessage.set(`${product.name} was added to your cart.`);
      },
      error: error => {
        this.cartMessage.set(getApiErrorMessage(error, 'Product could not be added to the cart.'));
      }
    });
  }

  cartItemCount(): number {
    return this.cartService.totalItems();
  }

  handleProductImageError(event: Event): void {
    const image = event.target as HTMLImageElement;

    if (image.src === this.fallbackProductImageUrl) {
      return;
    }

    image.src = this.fallbackProductImageUrl;
  }

  startEditingProduct(product: Product): void {
    this.cartMessage.set('');
    this.router.navigate(['/admin/products/edit'], {
      queryParams: { productId: product.id }
    });
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  submitSearch(): void {
    this.loadProducts(1);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.loadProducts(1);
  }

  categoryOptions(): Array<{ id: number; name: string }> {
    if (this.modalCategoryOptions().length > 0) {
      return this.modalCategoryOptions().map(category => ({
        id: category.id,
        name: category.name
      }));
    }

    const categories = new Map<number, string>();

    for (const product of this.products()) {
      categories.set(product.categoryId, product.categoryName);
    }

    return Array.from(categories, ([id, name]) => ({ id, name }));
  }

  updateFilterCategory(value: string): void {
    this.filterCategoryId.set(value);
  }

  updateFilterGender(value: string): void {
    this.filterGender.set(value);
  }

  updateFilterMinPrice(value: string): void {
    this.filterMinPrice.set(this.formatPriceFilterInput(value));
  }

  updateFilterMaxPrice(value: string): void {
    this.filterMaxPrice.set(this.formatPriceFilterInput(value));
  }

  updateFilterInStockOnly(value: boolean): void {
    this.filterInStockOnly.set(value);
  }

  updateSortBy(value: ProductSortOption): void {
    this.sortBy.set(value);
    this.loadProducts(1);
  }

  applyFilters(): void {
    this.loadProducts(1);
  }

  clearFilters(): void {
    this.filterCategoryId.set('');
    this.filterGender.set('');
    this.filterMinPrice.set('');
    this.filterMaxPrice.set('');
    this.filterInStockOnly.set(false);
    this.loadProducts(1);
  }

  canAccessAdminPanel(): boolean {
    return this.authService.canAccessAdminPanel();
  }

  canEditProducts(): boolean {
    return this.authService.hasPermission(UserPermission.EditProducts);
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

  private productFilters(): ProductListFilters {
    const filters: ProductListFilters = {
      searchTerm: this.searchTerm(),
      sortBy: this.sortBy()
    };

    const categoryId = this.parsePositiveNumber(this.filterCategoryId());
    if (categoryId !== undefined) {
      filters.categoryId = categoryId;
    }

    const gender = this.parsePositiveNumber(this.filterGender());
    if (gender !== undefined) {
      filters.gender = gender as ProductGender;
    }

    const minPrice = this.parseNonNegativeNumber(this.filterMinPrice());
    if (minPrice !== undefined) {
      filters.minPrice = minPrice;
    }

    const maxPrice = this.parseNonNegativeNumber(this.filterMaxPrice());
    if (maxPrice !== undefined) {
      filters.maxPrice = maxPrice;
    }

    if (this.filterInStockOnly()) {
      filters.inStockOnly = true;
    }

    return filters;
  }

  private loadModalCategories(): void {
    if (this.modalCategoryOptions().length > 0 || this.isLoadingCategories()) {
      return;
    }

    this.isLoadingCategories.set(true);

    this.categoryService.getCategories().pipe(
      finalize(() => {
        this.isLoadingCategories.set(false);
      })
    ).subscribe({
      next: categories => this.modalCategoryOptions.set(categories),
      error: error => {
        this.modalCategoryOptions.set([]);
        this.errorMessage.set(getApiErrorMessage(error, 'Categories could not be loaded.'));
      }
    });
  }

  private parsePositiveNumber(value: string): number | undefined {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
  }

  private formatPriceFilterInput(value: string): string {
    const digits = value.replace(/\D/g, '');

    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  private parseNonNegativeNumber(value: string): number | undefined {
    const normalizedValue = value.replace(/\./g, '').trim();

    if (normalizedValue === '') {
      return undefined;
    }

    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : undefined;
  }
}
