import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { User } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';
import { PaymentService } from '../../services/payment.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: [ './navbar.component.scss' ],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class NavbarComponent implements OnInit {
  navBackground = {};
  loggedIn = false;
  currentUser: User | null = null;
  isProfileMenuActive = false;
  isScrolled = false;
  showDropdown = false;
  isSearchActive = false;
  searchQuery = '';
  user: any;

  @HostListener('document:scroll') scrollover () {
    console.log(document.body.scrollTop, 'scrolllength#');

    if (document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
      this.navBackground = {
        'background-color': '#0e0e0ede'
      }
    } else {
      this.navBackground = {}
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
    if (window.scrollY > 100) {
      this.navBackground = {
        'background-color': '#141414',
        'box-shadow': '0 2px 10px rgba(0,0,0,0.3)'
      };
    } else {
      this.navBackground = {};
    }
  }

  constructor (
    private userService: UserService,
    private router: Router,
    private authService: AuthService,
    private paymentService: PaymentService
  ) {
    this.authService.user$.subscribe(user => {
      this.loggedIn = !!user;
      this.currentUser = user;
      this.user = user;
    });
  }

  onClick () {
    this.userService.logout()
      .then(() => {
        this.router.navigate([ '/login' ]);
      })
      .catch(error => console.log(error));
  }

  toggleProfileMenu() {
    this.isProfileMenuActive = !this.isProfileMenuActive;
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  hideDropdown() {
    this.showDropdown = false;
  }

  toggleSearch() {
    this.isSearchActive = !this.isSearchActive;
    if (!this.isSearchActive) {
      this.searchQuery = '';
    }
  }

  onSearchSubmit() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.searchQuery = '';
      this.isSearchActive = false;
    }
  }

  editProfile() {
    this.router.navigate(['/profile/edit']);
    this.hideDropdown();
  }

  goToPayment() {
    this.router.navigate(['/payment']);
    this.hideDropdown();
  }

  removeAllPayments() {
    this.paymentService.clearPaymentMethod();
    alert('All payment methods have been removed');
    this.hideDropdown();
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.paymentService.clearPaymentMethod();
    this.showDropdown = false;
  }

  goToSearch() {
    this.router.navigate(['/search']);
    this.hideDropdown();
  }

  // Close menus when clicking outside
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-box') && !target.closest('.navbar-item.has-dropdown')) {
      this.isSearchActive = false;
      this.isProfileMenuActive = false;
    }
  }

  ngOnInit(): void {
    // Add scroll event listener to handle navbar background
    window.addEventListener('scroll', () => {
      this.isScrolled = window.scrollY > 0;
    });
  }

  onSearch(event?: KeyboardEvent): void {
    if (event && event.key !== 'Enter') {
      return;
    }
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { 
        queryParams: { query: this.searchQuery }
      });
      this.isSearchActive = false;
      this.searchQuery = '';
    }
  }
}