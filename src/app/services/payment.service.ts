import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { getFunctions } from 'firebase/functions';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';
import { delay } from 'rxjs/operators';

interface CheckoutSessionData {
  priceId: string;
  userId: string;
  userEmail: string;
  planId: string;
}

interface PaymentIntentData {
  amount: number;
  currency: string;
  planId: string;
}

interface SubscriptionData {
  userId: string;
  priceId: string;
  planId: string;
}

interface Subscription {
  planId: string;
  status: string;
  currentPeriodEnd: Date;
}

export interface PaymentMethod {
  id: string;
  brand: 'Visa' | 'Mastercard';
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private hasPayment = new BehaviorSubject<boolean>(false);
  private functions: Functions;
  private stripe: Promise<Stripe | null>;
  private paymentMethodKey = 'netflix_clone_payment_method';
  private paymentMethodSubject = new BehaviorSubject<PaymentMethod | null>(null);
  paymentMethod$ = this.paymentMethodSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.functions = getFunctions();
    this.stripe = loadStripe(environment.stripe.publishableKey);
    // Check payment status on service initialization
    this.checkPaymentStatus();
  }

  private checkPaymentStatus() {
    const paymentDetails = localStorage.getItem('paymentDetails');
    this.hasPayment.next(paymentDetails !== null);
  }

  hasPaymentMethod(): boolean {
    const paymentDetails = localStorage.getItem('paymentDetails');
    return paymentDetails !== null && JSON.parse(paymentDetails).cardNumber !== '';
  }

  getPaymentDetails() {
    const paymentDetails = localStorage.getItem('paymentDetails');
    return paymentDetails ? JSON.parse(paymentDetails) : null;
  }

  clearPaymentMethod(): void {
    // Clear payment methods from local storage
    localStorage.removeItem('paymentMethods');
    this.hasPayment.next(false);
    this.paymentMethodSubject.next(null);
  }

  setPaymentMethod(method: PaymentMethod): void {
    this.paymentMethodSubject.next(method);
  }

  async createCheckoutSession(data: CheckoutSessionData) {
    const createStripeCheckout = httpsCallable(this.functions, 'createStripeCheckout');
    const result = await createStripeCheckout(data);
    return result.data as { url: string };
  }

  async createPaymentIntent(amount: number): Promise<{ clientSecret: string }> {
    const user = await firstValueFrom(this.authService.getCurrentUser());
    if (!user) throw new Error('No user logged in');

    const response = await firstValueFrom(
      this.http.post<{ clientSecret: string }>('/api/create-payment-intent', {
        amount,
        email: user.email
      })
    );

    return response;
  }

  async createSubscription(data: SubscriptionData) {
    const createSubscription = httpsCallable(this.functions, 'createSubscription');
    const result = await createSubscription(data);
    return result.data;
  }

  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const getSubscription = httpsCallable(this.functions, 'getSubscription');
    const result = await getSubscription({ userId });
    return result.data as Subscription | null;
  }

  async cancelSubscription(userId: string) {
    const cancelSubscription = httpsCallable(this.functions, 'cancelSubscription');
    await cancelSubscription({ userId });
  }

  async updateSubscription(userId: string, newPriceId: string) {
    const updateSubscription = httpsCallable(this.functions, 'updateSubscription');
    await updateSubscription({ userId, newPriceId });
  }

  async processPayment(paymentMethodId: string, plan: string): Promise<void> {
    const user = await firstValueFrom(this.authService.getCurrentUser());
    if (!user) throw new Error('No user logged in');

    try {
      // Create a payment intent
      const amount = this.getPlanAmount(plan);
      const { clientSecret } = await this.createPaymentIntent(amount);

      // Confirm the payment
      const stripe = await this.stripe;
      if (!stripe) throw new Error('Stripe failed to load');

      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId,
        receipt_email: user.email || undefined
      });

      if (error) {
        throw new Error(error.message);
      }

      // Update subscription in Firebase
      await this.authService.updateUserSubscription({
        plan,
        status: 'active',
        startDate: new Date().toISOString()
      });

      // Store payment method details locally
      this.setPaymentMethod({
        id: 'pm_' + Math.random().toString(36).substr(2, 9),
        brand: Math.random() > 0.5 ? 'Visa' : 'Mastercard',
        cardNumber: '**** **** **** 4242',
        expiryMonth: '12',
        expiryYear: '2025'
      });
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  }

  private getPlanAmount(plan: string): number {
    switch (plan.toLowerCase()) {
      case 'basic':
        return 999; // $9.99
      case 'standard':
        return 1499; // $14.99
      case 'premium':
        return 1999; // $19.99
      default:
        throw new Error('Invalid plan selected');
    }
  }

  // Mock method to add a payment method
  addPaymentMethod(): Observable<PaymentMethod> {
    // Simulating API call with mock data
    const mockPaymentMethod: PaymentMethod = {
      id: 'pm_' + Math.random().toString(36).substr(2, 9),
      brand: Math.random() > 0.5 ? 'Visa' : 'Mastercard',
      cardNumber: '**** **** **** 4242',
      expiryMonth: '12',
      expiryYear: '2025'
    };

    // Simulate network delay
    return of(mockPaymentMethod).pipe(
      delay(1000)
    );
  }
} 