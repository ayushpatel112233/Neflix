// import { Component, OnInit } from '@angular/core';
// import { FormControl, FormGroup } from '@angular/forms';
// import { Router } from '@angular/router';
// import { UserService } from 'src/app/services/user.service';

// @Component({
//   selector: 'app-register',
//   templateUrl: './register.component.html',
//   styleUrls: ['./register.component.scss']
// })
// export class RegisterComponent implements OnInit {

//   formRegister: FormGroup;

//   constructor (private userService: UserService, private router: Router) {
//     this.formRegister = new FormGroup({
//       email: new FormControl(),
//       password: new FormControl()
//     })
//   }

//   ngOnInit(): void {}

//   onSubmit () {
//     this.userService.register(this.formRegister.value)
//       .then(response => {
//         console.log(response);
//         this.router.navigate([ '/login' ]);
//       })
//       .catch(error => console.log(error));
//   }

// }



import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  formRegister: FormGroup;

  constructor(private userService: UserService, private router: Router) {
    // Add validation rules here
    this.formRegister = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)])
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.formRegister.valid) {
      this.userService.register(this.formRegister.value)
        .then(response => {
          console.log(response);
          this.router.navigate(['/login']);
        })
        .catch(error => console.log(error));
    }
  }

  // Method used in template to check if control has a specific error
  checkControl(controlName: string, errorType: string): boolean {
    const control = this.formRegister.get(controlName);
    return !!(control && control.hasError(errorType) && control.touched);
  }
  
}
