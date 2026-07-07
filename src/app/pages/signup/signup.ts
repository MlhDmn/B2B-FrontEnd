import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  errorMessage = signal('');
  isSubmitting = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  clearError(): void {
    this.errorMessage.set('');
  }

  submit(signupForm: NgForm): void {
    this.errorMessage.set('');

    if (signupForm.invalid) {
      signupForm.form.markAllAsTouched();
      this.errorMessage.set(this.getSignupValidationMessage(signupForm));
      return;
    }

    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isSubmitting.set(true);
    const { confirmPassword: _, ...request } = this.form;

    this.authService.register(request).pipe(
      finalize(() => {
        this.isSubmitting.set(false);
      })
    ).subscribe({
      next: () => this.router.navigate(['/home']),
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Registration failed. Please try again.'));
      }
    });
  }

  private getSignupValidationMessage(signupForm: NgForm): string {
    const emailControl = signupForm.controls['email'];
    const passwordControl = signupForm.controls['password'];
    const confirmPasswordControl = signupForm.controls['confirmPassword'];

    if (emailControl?.invalid && (passwordControl?.invalid || confirmPasswordControl?.invalid)) {
      return 'Please enter a valid email and password.';
    }

    if (emailControl?.invalid) {
      return 'Please enter a valid email address.';
    }

    if (passwordControl?.invalid || confirmPasswordControl?.invalid) {
      return 'Password must be at least 8 characters.';
    }

    return 'Please complete all required fields.';
  }
}
