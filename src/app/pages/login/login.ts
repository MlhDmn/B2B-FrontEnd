import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
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

  errorMessage = '';
  isSubmitting = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  submit(): void {
    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.login(this.form).pipe(
      finalize(() => this.isSubmitting = false)
    ).subscribe({
      next: () => this.router.navigate(['/home']),
      error: error => {
        this.errorMessage = error.error?.message ?? 'Login failed. Please try again.';
      }
    });
  }
}
