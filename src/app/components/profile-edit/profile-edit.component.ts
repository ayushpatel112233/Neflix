import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss']
})
export class ProfileEditComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern('^[0-9]{10}$')]],
      bio: ['', [Validators.maxLength(500)]],
      language: ['English', Validators.required],
      notifications: [true],
      autoplay: [true],
      subtitles: [true]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  async loadUserProfile() {
    this.loading = true;
    this.error = null;
    
    try {
      // Get basic user info from Firebase Auth
      const user = await this.authService.getCurrentUser().toPromise();
      
      if (user) {
        // Get additional profile data from Firestore
        const profileData = await this.authService.getUserProfile();
        
        // Combine data from both sources
        const combinedData = {
          displayName: user.displayName || '',
          email: user.email || '',
          phoneNumber: profileData?.phoneNumber || '',
          bio: profileData?.bio || '',
          language: profileData?.language || 'English',
          notifications: profileData?.notifications ?? true,
          autoplay: profileData?.autoplay ?? true,
          subtitles: profileData?.subtitles ?? true
        };
        
        // Update form with combined data
        this.profileForm.patchValue(combinedData);
      } else {
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      this.error = 'Failed to load profile data';
      this.router.navigate(['/login']);
    } finally {
      this.loading = false;
    }
  }

  async onSubmit() {
    if (this.profileForm.valid) {
      try {
        this.loading = true;
        this.error = null;
        this.success = null;

        const formData = this.profileForm.value;
        await this.authService.updateProfile({
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          bio: formData.bio,
          language: formData.language,
          notifications: formData.notifications,
          autoplay: formData.autoplay,
          subtitles: formData.subtitles
        });

        this.success = 'Profile updated successfully!';
        setTimeout(() => {
          this.router.navigate(['/profile']);
        }, 2000);
      } catch (error: any) {
        this.error = error.message || 'Failed to update profile';
      } finally {
        this.loading = false;
      }
    } else {
      this.error = 'Please fill all required fields correctly';
    }
  }

  onCancel() {
    this.router.navigate(['/profile']);
  }

  // Helper methods for form validation
  getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) return `${controlName} is required`;
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['minlength']) return `${controlName} must be at least ${control.errors['minlength'].requiredLength} characters`;
      if (control.errors['maxlength']) return `${controlName} must not exceed ${control.errors['maxlength'].requiredLength} characters`;
      if (control.errors['pattern']) return 'Please enter a valid phone number';
    }
    return '';
  }
} 