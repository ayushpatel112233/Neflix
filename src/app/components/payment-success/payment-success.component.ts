import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  countdown = 5;

  constructor(private router: Router) {}

  ngOnInit() {
    const timer = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(timer);
        this.router.navigate(['/profile']);
      }
    }, 1000);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
} 