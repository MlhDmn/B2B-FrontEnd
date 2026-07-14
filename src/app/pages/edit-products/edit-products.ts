import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { Category, CategoryService } from '../../services/category.service';
import {
  getProductGenderLabel,
  Product,
  ProductGender,
  ProductService,
  ProductUpdateRequest
} from '../../services/product.service';

@Component({
  selector: 'app-edit-products',
  imports: [FormsModule, RouterLink],
  templateUrl: './edit-products.html',
  styleUrl: './edit-products.css',
})
export class EditProducts implements OnInit {
  readonly pageSize = 100;
  readonly genderOptions = [
    ProductGender.Unisex,
    ProductGender.Men,
    ProductGender.Women,
    ProductGender.Kids
  ];
  readonly getProductGenderLabel = getProductGenderLabel;

  products = signal<Product[]>([]);
  categoryOptions = signal<Category[]>([]);
  selectedProduct = signal<Product | null>(null);
  selectedProductId = signal(0);
  isLoadingProducts = signal(true);
  isLoadingCategories = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  imageFileName = signal('');

  form: ProductUpdateRequest = this.createEmptyForm();
  private readonly requestedProductId: number;

  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly route: ActivatedRoute,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    this.requestedProductId = Number(this.route.snapshot.queryParamMap.get('productId')) || 0;
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadCategories();
    this.loadProducts();
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onImageSelected(event: Event): void {
    this.clearMessages();

    const input = event.target as HTMLInputElement;
    this.form.image = input.files?.[0] ?? null;
    this.imageFileName.set(this.form.image?.name ?? '');
  }

  loadProducts(): void {
    this.errorMessage.set('');
    this.isLoadingProducts.set(true);

    if (this.isProductLocked()) {
      this.loadLockedProduct();
      return;
    }

    this.productService.getProducts(1, this.pageSize).pipe(
      finalize(() => {
        this.isLoadingProducts.set(false);
      })
    ).subscribe({
      next: page => {
        this.products.set(page.items);

        if (page.items.length > 0 && this.selectedProductId() === 0) {
          const requestedProduct = page.items.find(product => product.id === this.requestedProductId);

          if (requestedProduct) {
            this.selectProduct(requestedProduct.id);
          } else {
            this.selectProduct(page.items[0].id);
          }
        }
      },
      error: error => {
        this.products.set([]);
        this.selectedProductId.set(0);
        this.form = this.createEmptyForm();
        this.errorMessage.set(getApiErrorMessage(error, 'Products could not be loaded.'));
      }
    });
  }

  loadLockedProduct(): void {
    this.productService.getProduct(this.requestedProductId).pipe(
      finalize(() => {
        this.isLoadingProducts.set(false);
      })
    ).subscribe({
      next: product => {
        this.products.set([product]);
        this.selectProduct(product.id);
      },
      error: error => {
        this.products.set([]);
        this.selectedProduct.set(null);
        this.selectedProductId.set(0);
        this.form = this.createEmptyForm();
        this.errorMessage.set(getApiErrorMessage(error, 'Product could not be loaded.'));
      }
    });
  }

  loadCategories(): void {
    this.errorMessage.set('');
    this.isLoadingCategories.set(true);

    this.categoryService.getCategories().pipe(
      finalize(() => {
        this.isLoadingCategories.set(false);
      })
    ).subscribe({
      next: categories => this.categoryOptions.set(categories),
      error: error => {
        this.categoryOptions.set([]);
        this.errorMessage.set(getApiErrorMessage(error, 'Categories could not be loaded.'));
      }
    });
  }

  selectProduct(productId: number): void {
    const normalizedProductId = Number(productId);

    if (this.isProductLocked() && normalizedProductId !== this.requestedProductId) {
      return;
    }

    const product = this.products().find(item => item.id === normalizedProductId);

    this.clearMessages();
    this.selectedProductId.set(normalizedProductId);

    if (!product) {
      this.selectedProduct.set(null);
      this.form = this.createEmptyForm();
      this.imageFileName.set('');
      return;
    }

    this.form = {
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
    this.imageFileName.set('');
    this.selectedProduct.set(product);
  }

  submit(editForm: NgForm): void {
    this.clearMessages();

    if (this.isProductLocked() && this.form.id !== this.requestedProductId) {
      this.errorMessage.set('This page can only edit the selected product.');
      return;
    }

    if (editForm.invalid || this.form.id === 0 || this.form.categoryId === 0) {
      editForm.form.markAllAsTouched();
      this.errorMessage.set('Please complete the required product details.');
      return;
    }

    this.isSubmitting.set(true);

    this.productService.updateProduct(this.form).pipe(
      finalize(() => {
        this.isSubmitting.set(false);
      })
    ).subscribe({
      next: updatedProduct => {
        this.successMessage.set('Product updated successfully.');
        this.products.update(products => products.map(product => (
          product.id === updatedProduct.id ? updatedProduct : product
        )));
        this.selectProduct(updatedProduct.id);
        this.successMessage.set('Product updated successfully.');
      },
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Product could not be updated.'));
      }
    });
  }

  private createEmptyForm(): ProductUpdateRequest {
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

  isProductLocked(): boolean {
    return this.requestedProductId > 0;
  }
}
