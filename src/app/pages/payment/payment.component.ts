import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  @ViewChild('cardElement') cardElement!: ElementRef;
  selectedPlan: any = null;
  loading: boolean = false;
  error: string | null = null;
  private stripe: any;
  private card: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private authService: AuthService
  ) {
    // Initialize Stripe with your publishable key
    this.stripe = loadStripe(environment.stripe.publishableKey);
  }

  ngOnInit() {
    // Get plan details from route
    this.route.queryParams.subscribe(params => {
      this.selectedPlan = {
        id: params['planId'],
        priceId: params['priceId'],
        name: params['planName'],
        price: params['price']
      };
    });

    if (!this.selectedPlan.id) {
      this.router.navigate(['/plans']);
    }
  }

  ngAfterViewInit() {
    // Initialize Stripe Elements
    const elements = this.stripe.elements();
    this.card = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });

    // Mount the card Element
    this.card.mount(this.cardElement.nativeElement);

    // Handle real-time validation errors
    this.card.addEventListener('change', (event: any) => {
      if (event.error) {
        this.error = event.error.message;
      } else {
        this.error = null;
      }
    });
  }

  async processPayment() {
    try {
      this.loading = true;
      this.error = null;

      const user = await this.authService.getCurrentUser().toPromise();
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      // Create payment intent
      const { clientSecret } = await this.paymentService.createPaymentIntent({
        amount: this.selectedPlan.price * 100, // Convert to cents
        currency: 'usd',
        planId: this.selectedPlan.id
      });

      // Confirm payment with Stripe
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.card,
          billing_details: {
            email: user.email
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Create subscription
        await this.paymentService.createSubscription({
          userId: user.uid,
          priceId: this.selectedPlan.priceId,
          planId: this.selectedPlan.id
        });

        // Save payment method
        this.paymentService.setPaymentMethod({
          cardNumber: '**** **** **** ' + paymentIntent.payment_method_details.card.last4,
          expiryDate: paymentIntent.payment_method_details.card.exp_month + '/' + paymentIntent.payment_method_details.card.exp_year,
          cardType: paymentIntent.payment_method_details.card.brand
        });

        // Redirect to success page
        this.router.navigate(['/payment/success']);
      }
    } catch (err: any) {
      this.error = err.message || 'Payment failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    // Clean up Stripe Elements
    if (this.card) {
      this.card.destroy();
    }
  }
} 