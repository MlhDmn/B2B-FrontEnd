import { Component, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import {
  Category,
  CategoryService,
  CategoryUpdateRequest
} from '../../services/category.service';

@Component({
  selector: 'app-edit-category',
  imports: [FormsModule, RouterLink],
  templateUrl: './edit-category.html',
  styleUrl: './edit-category.css',
})
export class EditCategory implements OnInit {
  categories = signal<Category[]>([]);
  selectedCategoryId = signal(0);
  isLoadingCategories = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  form: CategoryUpdateRequest = this.createEmptyForm();

  constructor(private readonly categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  loadCategories(): void {
    this.clearMessages();
    this.isLoadingCategories.set(true);

    this.categoryService.getCategories().pipe(
      finalize(() => {
        this.isLoadingCategories.set(false);
      })
    ).subscribe({
      next: categories => {
        this.categories.set(categories);

        if (categories.length > 0 && this.selectedCategoryId() === 0) {
          this.selectCategory(categories[0].id);
        }
      },
      error: error => {
        this.categories.set([]);
        this.selectedCategoryId.set(0);
        this.form = this.createEmptyForm();
        this.errorMessage.set(getApiErrorMessage(error, 'Categories could not be loaded.'));
      }
    });
  }

  selectCategory(categoryId: number): void {
    const normalizedCategoryId = Number(categoryId);
    const category = this.categories().find(item => item.id === normalizedCategoryId);

    this.clearMessages();
    this.selectedCategoryId.set(normalizedCategoryId);

    if (!category) {
      this.form = this.createEmptyForm();
      return;
    }

    this.form = {
      name: category.name,
      description: category.description
    };
  }

  submit(categoryForm: NgForm): void {
    this.clearMessages();

    if (categoryForm.invalid || this.selectedCategoryId() === 0) {
      categoryForm.form.markAllAsTouched();
      this.errorMessage.set('Please select a category and complete the required details.');
      return;
    }

    const request: CategoryUpdateRequest = {
      name: this.form.name.trim(),
      description: this.form.description.trim()
    };

    if (!request.name) {
      this.errorMessage.set('Category name is required.');
      return;
    }

    this.isSubmitting.set(true);

    this.categoryService.updateCategory(this.selectedCategoryId(), request).pipe(
      finalize(() => {
        this.isSubmitting.set(false);
      })
    ).subscribe({
      next: updatedCategory => {
        this.categories.update(categories => categories.map(category => (
          category.id === updatedCategory.id ? updatedCategory : category
        )));
        this.selectCategory(updatedCategory.id);
        this.successMessage.set('Category updated successfully.');
      },
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Category could not be updated.'));
      }
    });
  }

  private createEmptyForm(): CategoryUpdateRequest {
    return {
      name: '',
      description: ''
    };
  }
}
