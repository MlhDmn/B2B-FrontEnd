import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { CategoryCreateRequest, CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-add-category',
  imports: [FormsModule, RouterLink],
  templateUrl: './add-category.html',
  styleUrl: './add-category.css',
})
export class AddCategory {
  form: CategoryCreateRequest = {
    name: '',
    description: ''
  };

  errorMessage = signal('');
  successMessage = signal('');
  isSubmitting = signal(false);

  constructor(
    private readonly categoryService: CategoryService,
    private readonly router: Router
  ) {}

  clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  submit(categoryForm: NgForm): void {
    this.clearMessages();

    if (categoryForm.invalid) {
      categoryForm.form.markAllAsTouched();
      this.errorMessage.set('Please complete the required category details.');
      return;
    }

    const request: CategoryCreateRequest = {
      name: this.form.name.trim(),
      description: this.form.description.trim()
    };

    if (!request.name) {
      this.errorMessage.set('Category name is required.');
      return;
    }

    this.isSubmitting.set(true);

    this.categoryService.createCategory(request).pipe(
      finalize(() => {
        this.isSubmitting.set(false);
      })
    ).subscribe({
      next: () => {
        this.successMessage.set('Category created successfully.');
        this.router.navigate(['/admin/categories']);
      },
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Category could not be created.'));
      }
    });
  }
}
