import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { Category, CategoryService } from '../../services/category.service';
import {
  ProductCreateRequest,
  ProductGender,
  ProductService,
  getProductGenderLabel
} from '../../services/product.service';

@Component({
  selector: 'app-add-product',
  imports: [FormsModule, RouterLink],
  templateUrl: './add-product.html',
  styleUrl: './add-product.css',
})
export class AddProduct implements OnInit {
  form: ProductCreateRequest = {
    name: '',
    price: 0,
    origin: '',
    sizeRange: '',
    material: '',
    gender: ProductGender.Unisex,
    imageUrl: '',
    stockQuantity: 0,
    description: '',
    categoryId: 0
  };

  readonly genderOptions = [
    ProductGender.Unisex,
    ProductGender.Men,
    ProductGender.Women,
    ProductGender.Kids
  ];
  readonly getProductGenderLabel = getProductGenderLabel;

  categoryOptions = signal<Category[]>([]);
  categoryErrorMessage = signal('');
  isLoadingCategories = signal(true);
  errorMessage = signal('');
  isSubmitting = signal(false);

  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadCategories();
  }

  clearError(): void {
    this.errorMessage.set('');
  }

  loadCategories(): void {
    this.categoryErrorMessage.set('');
    this.isLoadingCategories.set(true);

    this.categoryService.getCategories().pipe(
      finalize(() => {
        this.isLoadingCategories.set(false);
      })
    ).subscribe({
      next: categories => {
        this.categoryOptions.set(categories);

        if (categories.length > 0 && this.form.categoryId === 0) {
          this.form.categoryId = categories[0].id;
        }
      },
      error: error => {
        this.categoryOptions.set([]);
        this.form.categoryId = 0;
        this.categoryErrorMessage.set(getApiErrorMessage(
          error,
          'Categories could not be loaded. Make sure the backend is running.'
        ));
      }
    });
  }

  submit(productForm: NgForm): void {
    this.errorMessage.set('');

    if (productForm.invalid || this.form.categoryId === 0) {
      productForm.form.markAllAsTouched();
      this.errorMessage.set('Please complete the required product details.');
      return;
    }

    this.isSubmitting.set(true);

    this.productService.createProduct(this.form).pipe(
      finalize(() => {
        this.isSubmitting.set(false);
      })
    ).subscribe({
      next: () => this.router.navigate(['/home']),
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Product could not be created.'));
      }
    });
  }
}
