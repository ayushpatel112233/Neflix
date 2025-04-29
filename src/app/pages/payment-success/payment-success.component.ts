import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  error: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.verifySubscription();
  }

  async verifySubscription() {
    try {
      const user = await this.authService.getCurrentUser().toPromise();
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 2000);
    } catch (err: any) {
      this.error = err.message || 'Something went wrong. Please try again.';
    }
  }
} 