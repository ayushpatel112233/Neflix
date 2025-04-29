// import { Component, OnInit } from '@angular/core';
// import { FormControl, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { UserService } from 'src/app/services/user.service';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss']
// })
// export class LoginComponent implements OnInit {

//   formLogin: FormGroup;

//   constructor (private userService: UserService, private router: Router) {
//     this.formLogin = new FormGroup({
//       email: new FormControl('', [Validators.required]),
//       password: new FormControl('', [
//         Validators.required,
//         Validators.minLength(6)
//       ]),
//     });
//   }

//   ngOnInit(): void {
//   }

//   onSubmit () {
//     this.userService.login(this.formLogin.value)
//       .then(response => {
//         console.log(response);
//       })
//       .catch(error => console.log(error));
//   }

//   onClick () {
//     this.userService.loginWithGoogle()
//       .then(response => {
//         console.log(response);
//         this.router.navigate([ '/home' ]);
//       })
//       .catch(error => console.log(error));
//   }

//   /* checkcontrol for email in formLogin */
//   /* get email () {
//     return this.formLogin.get('email');
//   }
//  */
//   checkControl (controlName: string, errorName: string): boolean {
//     if (
//       this.formLogin.get(controlName)?.hasError(errorName) &&
//       this.formLogin.get(controlName)?.touched
//     ) {
//       return true;
//     } else {
//       return false;
//     }
//   }
// }



// import { Component, OnInit } from '@angular/core';
// import { FormControl, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { UserService } from 'src/app/services/user.service';

// @Component({
//   selector: 'app-login',
//   templateUrl: './login.component.html',
//   styleUrls: ['./login.component.scss']
// })
// export class LoginComponent implements OnInit {

//   formLogin: FormGroup;
//   errorMessage: string = '';

//   constructor(private userService: UserService, private router: Router) {
//     this.formLogin = new FormGroup({
//       email: new FormControl('', [Validators.required, Validators.email]),
//       password: new FormControl('', [
//         Validators.required,
//         Validators.minLength(6)
//       ]),
//     });
//   }

//   ngOnInit(): void {}

//   onSubmit() {
//     if (this.formLogin.invalid) return;

//     this.errorMessage = ''; // Reset error

//     this.userService.login(this.formLogin.value)
//       .then(response => {
//         console.log(response);
//         this.router.navigate(['/home']);
//       })
//       .catch(error => {
//         console.error(error);
//         switch (error.code) {
//           case 'auth/user-not-found':
//             this.errorMessage = 'No user found with this email.';
//             break;
//           case 'auth/wrong-password':
//             this.errorMessage = 'Incorrect password.';
//             break;
//           case 'auth/invalid-email':
//             this.errorMessage = 'Invalid email address.';
//             break;
//           default:
//             this.errorMessage = error.message || 'Login failed. Please try again.';
//         }
//       });
//   }

//   onClick() {
//     this.errorMessage = ''; // Reset error
//     this.userService.loginWithGoogle()
//       .then(response => {
//         console.log(response);
//         this.router.navigate(['/home']);
//       })
//       .catch(error => {
//         console.log(error);
//         this.errorMessage = 'Google login failed. Please try again.';
//       });
//   }

//   checkControl(controlName: string, errorName: string): boolean {
//     const control = this.formLogin.get(controlName);
//     return control?.hasError(errorName) && control?.touched ? true : false;
//   }
// }



import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  formLogin: FormGroup;
  errorMessage: string = '';

  constructor(private userService: UserService, private router: Router) {
    this.formLogin = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6)
      ]),
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    if (this.formLogin.invalid) return;

    this.errorMessage = ''; // Reset error

    this.userService.login(this.formLogin.value)
      .then(response => {
        console.log(response);
        this.router.navigate(['/home']);
      })
      .catch(error => {
        console.error(error);
        switch (error.code) {
          case 'auth/user-not-found':
            this.errorMessage = 'No user found with this email.';
            break;
          case 'auth/wrong-password':
            this.errorMessage = 'Incorrect password.';
            break;
          case 'auth/invalid-email':
            this.errorMessage = 'Invalid email address.';
            break;
          default:
            this.errorMessage = error.message || 'Login failed. Please try again.';
        }
      });
  }

  onClick() {
    this.errorMessage = ''; // Reset error
    this.userService.loginWithGoogle()
      .then(response => {
        console.log(response);
        this.router.navigate(['/home']);
      })
      .catch(error => {
        console.log(error);
        this.errorMessage = 'Google login failed. Please try again.';
      });
  }

  checkControl(controlName: string, errorName: string): boolean {
    const control = this.formLogin.get(controlName);
    return control?.hasError(errorName) && control?.touched ? true : false;
  }
}
