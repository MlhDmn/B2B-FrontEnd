import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout-failure',
  imports: [RouterLink],
  templateUrl: './checkout-failure.html',
  styleUrl: './checkout-failure.css',
})
export class CheckoutFailure {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly reasons = this.getReasons();

  private getReasons(): string[] {
    const navigationReasons = this.router.getCurrentNavigation()?.extras.state?.['reasons'];

    if (this.isReasonList(navigationReasons)) {
      return navigationReasons;
    }

    if (isPlatformBrowser(this.platformId)) {
      const historyReasons = history.state?.reasons;

      if (this.isReasonList(historyReasons)) {
        return historyReasons;
      }
    }

    return ['One or more products could not be validated. Please review your cart and try again.'];
  }

  private isReasonList(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(reason => typeof reason === 'string');
  }
}
