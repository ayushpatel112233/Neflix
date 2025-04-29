import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PaymentService } from '../services/payment.service';
import { map, take, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  canActivate() {
    return this.authService.getCurrentUser().pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return of(false);
        }

        return this.paymentService.getCurrentSubscription(user.uid).then(subscription => {
          if (subscription && subscription.status === 'active') {
            return true;
          } else {
            this.router.navigate(['/plans']);
            return false;
          }
        }).catch(() => {
          this.router.navigate(['/plans']);
          return false;
        });
      })
    );
  }
} 