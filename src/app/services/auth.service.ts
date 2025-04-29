import { Injectable } from '@angular/core';
import { Auth, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { map, switchMap, retry, catchError } from 'rxjs/operators';
import { enableIndexedDbPersistence } from 'firebase/firestore';

// Define the profile interface
export interface UserProfile {
  displayName: string;
  phoneNumber?: string;
  bio?: string;
  language?: string;
  notifications?: boolean;
  autoplay?: boolean;
  subtitles?: boolean;
  subscription?: {
    plan: string;
    status: string;
    startDate: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private isOnline = new BehaviorSubject<boolean>(navigator.onLine);

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    // Enable offline persistence
    enableIndexedDbPersistence(this.firestore)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
          console.warn('The current browser does not support offline persistence');
        }
      });

    // Monitor online/offline status
    window.addEventListener('online', () => this.isOnline.next(true));
    window.addEventListener('offline', () => this.isOnline.next(false));

    // Monitor auth state
    this.auth.onAuthStateChanged(user => {
      this.userSubject.next(user);
    });
  }

  getCurrentUser(): Observable<User | null> {
    return this.user$;
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.userSubject.next(userCredential.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email: string, password: string, displayName: string): Promise<void> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      // Create initial profile in Firestore
      await this.createUserProfile(userCredential.user.uid, {
        displayName,
        language: 'English',
        notifications: true,
        autoplay: true,
        subtitles: true
      });
      
      this.userSubject.next(userCredential.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.userSubject.next(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async updateProfile(profile: UserProfile): Promise<void> {
    const user = this.userSubject.value;
    if (!user) throw new Error('No user logged in');

    try {
      // Update Firebase Auth profile (only displayName is supported)
      if (profile.displayName) {
        await updateProfile(user, { displayName: profile.displayName });
      }

      // Update additional profile data in Firestore
      await this.updateUserProfile(user.uid, profile);

      // Update user subject with new data
      const updatedUser = { ...user, displayName: profile.displayName };
      this.userSubject.next(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  private async createUserProfile(uid: string, profile: UserProfile): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await setDoc(userRef, profile);
  }

  private async updateUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
    const userRef = doc(this.firestore, 'users', uid);
    await updateDoc(userRef, profile);
  }

  async getUserProfile(): Promise<UserProfile | null> {
    const user = this.userSubject.value;
    if (!user) return null;

    try {
      const userRef = doc(this.firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      
      // If no profile exists, create one with default values
      const defaultProfile: UserProfile = {
        displayName: user.displayName || '',
        language: 'English',
        notifications: true,
        autoplay: true,
        subtitles: true
      };
      
      await this.createUserProfile(user.uid, defaultProfile);
      return defaultProfile;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async updateUserSubscription(subscription: { plan: string; status: string; startDate: string }): Promise<void> {
    const user = this.userSubject.value;
    if (!user) throw new Error('No user logged in');

    const maxRetries = 3;
    let retryCount = 0;

    const tryUpdate = async (): Promise<void> => {
      try {
        const userRef = doc(this.firestore, 'users', user.uid);
        
        // First try to get the document
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // Update existing profile with subscription
          await updateDoc(userRef, {
            subscription
          });
        } else {
          // Create new profile with subscription
          await setDoc(userRef, {
            displayName: user.displayName || '',
            language: 'English',
            notifications: true,
            autoplay: true,
            subtitles: true,
            subscription
          });
        }
      } catch (error: any) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        
        if (!this.isOnline.value) {
          throw new Error('You are currently offline. Please check your internet connection and try again.');
        }

        if (retryCount < maxRetries) {
          retryCount++;
          // Wait for a second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return tryUpdate();
        }
        
        throw error;
      }
    };

    return tryUpdate();
  }

  // Helper method to check online status
  isUserOnline(): boolean {
    return this.isOnline.value;
  }
} 