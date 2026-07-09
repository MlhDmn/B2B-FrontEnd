import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  selectedProductId = signal(0);
  isLoadingProducts = signal(true);
  isLoadingCategories = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  form: ProductUpdateRequest = this.createEmptyForm();

  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

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

  loadProducts(): void {
    this.errorMessage.set('');
    this.isLoadingProducts.set(true);

    this.productService.getProducts(1, this.pageSize).pipe(
      finalize(() => {
        this.isLoadingProducts.set(false);
      })
    ).subscribe({
      next: page => {
        this.products.set(page.items);

        if (page.items.length > 0 && this.selectedProductId() === 0) {
          this.selectProduct(page.items[0].id);
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
    const product = this.products().find(item => item.id === Number(productId));

    this.clearMessages();
    this.selectedProductId.set(Number(productId));

    if (!product) {
      this.form = this.createEmptyForm();
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
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
      description: product.description,
      categoryId: product.categoryId,
      isActive: product.isActive
    };
  }

  submit(editForm: NgForm): void {
    this.clearMessages();

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
      imageUrl: '',
      stockQuantity: 0,
      description: '',
      categoryId: 0,
      isActive: true
    };
  }
}
