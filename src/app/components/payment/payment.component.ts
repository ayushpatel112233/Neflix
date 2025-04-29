import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PaymentService, PaymentMethod } from '../../services/payment.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  plans = [
    { 
      name: 'Basic', 
      price: '9.99', 
      features: ['HD Available', 'Watch on 1 Device', 'Unlimited Movies & TV Shows'],
      priceId: 'price_basic'
    },
    { 
      name: 'Standard', 
      price: '14.99', 
      features: ['Full HD Available', 'Watch on 2 Devices', 'Unlimited Movies & TV Shows'],
      priceId: 'price_standard'
    },
    { 
      name: 'Premium', 
      price: '19.99', 
      features: ['4K + HDR Available', 'Watch on 4 Devices', 'Unlimited Movies & TV Shows'],
      priceId: 'price_premium'
    }
  ];
  selectedPlan = this.plans[0];
  isProcessing = false;
  error: string | null = null;
  showSuccessMessage = false;
  isOnline = navigator.onLine;
  loading = false;
  paymentMethod: PaymentMethod | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private paymentService: PaymentService
  ) {
    // Monitor online status
    this.isOnline = navigator.onLine;
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.error = null;
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.error = 'You are currently offline. Please check your internet connection.';
    });
  }

  ngOnInit() {
    // Check if user is logged in
    this.authService.getCurrentUser().subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
      }
    });

    // Monitor online/offline status
    window.addEventListener('online', this.handleOnlineStatus);
    window.addEventListener('offline', this.handleOnlineStatus);

    // Subscribe to payment method changes
    this.subscriptions.push(
      this.paymentService.paymentMethod$.subscribe(
        (method: PaymentMethod | null) => this.paymentMethod = method
      )
    );
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.handleOnlineStatus);
    window.removeEventListener('offline', this.handleOnlineStatus);
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private handleOnlineStatus = () => {
    this.isOnline = navigator.onLine;
    if (!this.isOnline) {
      this.error = 'You are currently offline. Please check your internet connection.';
    } else {
      this.error = null;
    }
  }

  selectPlan(plan: any) {
    this.selectedPlan = plan;
  }

  async onSubscribe() {
    if (!this.isOnline) {
      this.error = 'Cannot process payment while offline. Please check your internet connection.';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      // Implement subscription logic here with retry mechanism
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Your subscription logic here
          // await this.subscriptionService.subscribe();
          break;
        } catch (error) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    } catch (error) {
      this.error = 'Failed to process payment. Please try again later.';
      console.error('Payment error:', error);
    } finally {
      this.loading = false;
    }
  }

  onPaymentMethodUpdate(method: PaymentMethod) {
    this.paymentService.setPaymentMethod(method);
  }

  clearPaymentMethod() {
    this.paymentMethod = null;
    this.paymentService.clearPaymentMethod();
  }

  onAddPaymentMethod() {
    if (!this.isOnline) {
      this.error = 'Cannot add payment method while offline';
      return;
    }
    
    this.loading = true;
    this.paymentService.addPaymentMethod()
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (method: PaymentMethod) => {
          this.paymentMethod = method;
          this.error = null;
          this.showSuccessMessage = true;
        },
        error: (err: Error) => {
          this.error = 'Failed to add payment method. Please try again.';
          console.error('Payment method error:', err);
        }
      });
  }

  async onPayNow() {
    this.showSuccessMessage = true;
    try {
      await this.authService.updateUserSubscription({
        plan: this.selectedPlan.name,
        status: 'active',
        startDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
    setTimeout(() => {
      this.router.navigate(['/profile']);
    }, 2000); // Redirect after 2 seconds
  }
} 