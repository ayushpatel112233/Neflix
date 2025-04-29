import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../../services/auth.service';
import { Router } from '@angular/router';
import { updateProfile } from 'firebase/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  subscriptionDetails: any = null;
  watchHistory: any[] = [];
  preferences: any = {
    language: 'English',
    notifications: true,
    autoplay: true,
    subtitles: true
  };
  profileImage: string | null = null;
  displayName: string = '';
  isEditing: boolean = false;
  profileData: UserProfile | null = null;

  profileForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadSubscriptionDetails();
    this.loadWatchHistory();
  }

  async loadUserProfile() {
    try {
      // Subscribe to user changes
      this.authService.getCurrentUser().subscribe(async (user) => {
        if (user) {
          this.user = user;
          this.displayName = user.displayName || '';
          
          // Get additional profile data from Firestore
          this.profileData = await this.authService.getUserProfile();
          
          // Update preferences from profile data
          if (this.profileData) {
            this.preferences = {
              language: this.profileData.language || 'English',
              notifications: this.profileData.notifications ?? true,
              autoplay: this.profileData.autoplay ?? true,
              subtitles: this.profileData.subtitles ?? true
            };
          }
          
          // Update form with user data
          this.profileForm.patchValue({
            displayName: user.displayName || ''
          });
          
          // Load profile image from localStorage or use default
          const savedImage = localStorage.getItem(`profileImage_${user.uid}`);
          this.profileImage = savedImage || user.photoURL || 'assets/default-avatar.png';
        } else {
          this.router.navigate(['/login']);
        }
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      this.router.navigate(['/login']);
    }
  }

  async loadSubscriptionDetails() {
    try {
      const user = await this.authService.getCurrentUser().toPromise();
      if (user) {
        const profile = await this.authService.getUserProfile();
        if (profile && profile.subscription) {
          this.subscriptionDetails = {
            plan: profile.subscription.plan,
            status: profile.subscription.status,
            nextBillingDate: new Date(profile.subscription.startDate)
          };
        } else {
          // Set default values for new users without subscription
          this.subscriptionDetails = {
            plan: 'No Plan',
            status: 'Inactive',
            nextBillingDate: null
          };
        }
      }
    } catch (error) {
      console.error('Error loading subscription details:', error);
      // Set error state
      this.subscriptionDetails = {
        plan: 'Error',
        status: 'Unknown',
        nextBillingDate: null
      };
    }
  }

  loadWatchHistory() {
    // This would typically load from a service
    this.watchHistory = [
      { title: 'Movie 1', progress: 75 },
      { title: 'Movie 2', progress: 30 },
      { title: 'Movie 3', progress: 100 }
    ];
  }

  editProfile() {
    this.router.navigate(['/profile/edit']);
  }

  updatePreference(key: string, value: any) {
    this.preferences[key] = value;
    // In a real app, you would save this to the backend
    console.log('Preferences updated:', this.preferences);
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.updatePreference('language', select.value);
  }

  onToggleChange(event: Event, key: string) {
    const checkbox = event.target as HTMLInputElement;
    this.updatePreference(key, checkbox.checked);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  toggleEdit() {
    if (this.isEditing) {
      this.saveProfile();
    } else {
      this.isEditing = true;
      this.profileForm.patchValue({
        displayName: this.displayName
      });
    }
  }

  async saveProfile() {
    if (this.user && this.profileForm.valid) {
      try {
        const updatedProfile: UserProfile = {
          displayName: this.profileForm.get('displayName')?.value,
          language: this.preferences.language,
          notifications: this.preferences.notifications,
          autoplay: this.preferences.autoplay,
          subtitles: this.preferences.subtitles
        };

        await this.authService.updateProfile(updatedProfile);
        
        // Update local user data
        this.displayName = updatedProfile.displayName;
        this.user.displayName = updatedProfile.displayName;
        
        // Save profile image if changed
        if (this.profileImage && this.profileImage !== this.user.photoURL) {
          localStorage.setItem(`profileImage_${this.user.uid}`, this.profileImage);
        }
        
        this.isEditing = false;
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.profileForm.patchValue({
      displayName: this.displayName
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToPayment() {
    this.router.navigate(['/payment']);
  }
} 