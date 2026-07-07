import { Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../services/api-response';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  form = {
    email: '',
    password: ''
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

  submit(loginForm: NgForm): void {
    this.errorMessage.set('');

    if (loginForm.invalid) {
      loginForm.form.markAllAsTouched();
      this.errorMessage.set(this.getLoginValidationMessage(loginForm));
      return;
    }

    this.isSubmitting.set(true);

    this.authService.login(this.form).pipe(
      finalize(() => {
        this.isSubmitting.set(false);
      })
    ).subscribe({
      next: () => this.router.navigate(['/home']),
      error: error => {
        this.errorMessage.set(getApiErrorMessage(error, 'Login failed. Please try again.'));
      }
    });
  }

  private getLoginValidationMessage(loginForm: NgForm): string {
    const emailControl = loginForm.controls['email'];
    const passwordControl = loginForm.controls['password'];

    if (emailControl?.invalid && passwordControl?.invalid) {
      return 'Please enter a valid email and password.';
    }

    if (emailControl?.invalid) {
      return 'Please enter a valid email address.';
    }

    if (passwordControl?.invalid) {
      return 'Please enter your password.';
    }

    return 'Please check your email and password.';
  }
}
