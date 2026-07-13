import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { AuthService, UserPermission } from '../../services/auth.service';
import { Category, CategoryService } from '../../services/category.service';
import {
  getProductGenderLabel,
  Product,
  ProductGender,
  ProductListFilters,
  ProductService,
  ProductUpdateRequest
} from '../../services/product.service';

@Component({
  selector: 'app-landing',
  imports: [FormsModule, RouterLink],
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
  isEditingProduct = signal(false);
  isLoadingCategories = signal(false);
  isSubmittingProduct = signal(false);
  productEditErrorMessage = signal('');
  productEditSuccessMessage = signal('');
  modalCategoryOptions = signal<Category[]>([]);
  searchTerm = signal('');
  filterCategoryId = signal('');
  filterGender = signal('');
  filterMinPrice = signal('');
  filterMaxPrice = signal('');
  filterInStockOnly = signal(false);

  readonly genderOptions = [
    ProductGender.Unisex,
    ProductGender.Men,
    ProductGender.Women,
    ProductGender.Kids
  ];

  readonly getProductGenderLabel = getProductGenderLabel;

  productEditForm: ProductUpdateRequest = this.createEmptyProductEditForm();

  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly authService: AuthService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadProducts(1);
    this.loadModalCategories();
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
    this.resetProductEditState();
  }

  closeProductDetails(): void {
    this.selectedProduct.set(null);
    this.resetProductEditState();
  }

  startEditingProduct(product: Product): void {
    this.productEditForm = this.createProductEditForm(product);
    this.productEditErrorMessage.set('');
    this.productEditSuccessMessage.set('');
    this.isEditingProduct.set(true);
    this.loadModalCategories();
  }

  cancelEditingProduct(): void {
    this.resetProductEditState();
  }

  clearProductEditMessages(): void {
    this.productEditErrorMessage.set('');
    this.productEditSuccessMessage.set('');
  }

  onProductEditImageSelected(event: Event): void {
    this.clearProductEditMessages();

    const input = event.target as HTMLInputElement;
    this.productEditForm.image = input.files?.[0] ?? null;
  }

  submitProductEdit(editForm: NgForm): void {
    this.clearProductEditMessages();

    if (editForm.invalid || this.productEditForm.id === 0 || this.productEditForm.categoryId === 0) {
      editForm.form.markAllAsTouched();
      this.productEditErrorMessage.set('Please complete the required product details.');
      return;
    }

    this.isSubmittingProduct.set(true);

    this.productService.updateProduct(this.productEditForm).pipe(
      finalize(() => {
        this.isSubmittingProduct.set(false);
      })
    ).subscribe({
      next: updatedProduct => {
        this.products.update(products => products.map(product => (
          product.id === updatedProduct.id ? updatedProduct : product
        )));
        this.selectedProduct.set(updatedProduct);
        this.productEditForm = this.createProductEditForm(updatedProduct);
        this.productEditSuccessMessage.set('Product updated successfully.');
      },
      error: error => {
        this.productEditErrorMessage.set(getApiErrorMessage(error, 'Product could not be updated.'));
      }
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
    this.filterMinPrice.set(value);
  }

  updateFilterMaxPrice(value: string): void {
    this.filterMaxPrice.set(value);
  }

  updateFilterInStockOnly(value: boolean): void {
    this.filterInStockOnly.set(value);
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
      searchTerm: this.searchTerm()
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
        this.productEditErrorMessage.set(getApiErrorMessage(error, 'Categories could not be loaded.'));
      }
    });
  }

  private resetProductEditState(): void {
    this.isEditingProduct.set(false);
    this.isSubmittingProduct.set(false);
    this.productEditErrorMessage.set('');
    this.productEditSuccessMessage.set('');
    this.productEditForm = this.createEmptyProductEditForm();
  }

  private createProductEditForm(product: Product): ProductUpdateRequest {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      origin: product.origin,
      sizeRange: product.sizeRange,
      material: product.material,
      gender: product.gender,
      image: null,
      stockQuantity: product.stockQuantity,
      description: product.description,
      categoryId: product.categoryId,
      isActive: product.isActive
    };
  }

  private createEmptyProductEditForm(): ProductUpdateRequest {
    return {
      id: 0,
      name: '',
      price: 0,
      origin: '',
      sizeRange: '',
      material: '',
      gender: ProductGender.Unisex,
      image: null,
      stockQuantity: 0,
      description: '',
      categoryId: 0,
      isActive: true
    };
  }

  private parsePositiveNumber(value: string): number | undefined {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined;
  }

  private parseNonNegativeNumber(value: string): number | undefined {
    if (value.trim() === '') {
      return undefined;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : undefined;
  }
}
