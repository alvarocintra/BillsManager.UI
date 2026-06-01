import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isLoginMode = true;
  isLoading = false;
  submitted = false;
  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  initializeForms(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.registerForm = this.formBuilder.group({
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.submitted = false;
    this.showLoginPassword = false;
    this.showRegisterPassword = false;
    this.showConfirmPassword = false;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  togglePasswordVisibility(field: 'login' | 'register' | 'confirm'): void {
    if (field === 'login') {
      this.showLoginPassword = !this.showLoginPassword;
    } else if (field === 'register') {
      this.showRegisterPassword = !this.showRegisterPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  onLogin(): void {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.toastr.success('Login successful!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(error.message || 'Login failed');
      }
    });
  }

  onRegister(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password, firstName, lastName } = this.registerForm.value;

    this.authService.register(email, password, firstName, lastName).subscribe({
      next: () => {
        this.toastr.success('Registration successful! Please log in.');
        this.isLoginMode = true;
        this.submitted = false;
        this.isLoading = false;
        this.registerForm.reset();
        this.loginForm.patchValue({ email });
      },
      error: (error) => {
        this.isLoading = false;
        this.toastr.error(error.message || 'Registration failed');
      }
    });
  }

  passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }

    return null;
  }

  get loginEmail() {
    return this.loginForm.get('email');
  }

  get loginPassword() {
    return this.loginForm.get('password');
  }

  get registerFirstName() {
    return this.registerForm.get('firstName');
  }

  get registerLastName() {
    return this.registerForm.get('lastName');
  }

  get registerEmail() {
    return this.registerForm.get('email');
  }

  get registerPassword() {
    return this.registerForm.get('password');
  }

  get registerConfirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
}
