import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { UsersService } from '../../../services/users-service';
import { AuthMessageService } from '../../../services/auth-message-service';
import { FloatLabel } from 'primeng/floatlabel';
import { DialogModule } from 'primeng/dialog';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    FloatLabel,
    PasswordModule,
    DialogModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  userSrv: UsersService = inject(UsersService);
  private router = inject(Router);
  private authMessage = inject(AuthMessageService);
  email: string = null as unknown as string;
  pass: string = '';
  private authService = inject(AuthService);

  forgotPasswordVisible = false;
  forgotPasswordStep: 1 | 2 | 3 = 1;
  forgotPasswordEmail = '';
  forgotPasswordCode = '';
  forgotPasswordNewPass = '';
  forgotPasswordError = '';
  sendingCode = false;
  resettingPassword = false;
  /** Shown when login fails (wrong password or user not found). */
  loginError = signal<string>('');

  openForgotPasswordDialog() {
    this.forgotPasswordVisible = true;
    this.forgotPasswordStep = 1;
    this.forgotPasswordEmail = this.email || '';
    this.forgotPasswordCode = '';
    this.forgotPasswordNewPass = '';
    this.forgotPasswordError = '';
  }

  closeForgotPasswordDialog() {
    this.forgotPasswordVisible = false;
    this.forgotPasswordStep = 1;
    this.forgotPasswordError = '';
  }

  sendResetCode() {
    const email = this.forgotPasswordEmail?.trim();
    if (!email) {
      this.forgotPasswordError = 'נא להזין כתובת דוא"ל';
      return;
    }
    this.forgotPasswordError = '';
    this.sendingCode = true;
    this.userSrv.requestPasswordResetCode(email).subscribe({
      next: (res) => {
        this.sendingCode = false;
        if (res.sent) {
          this.forgotPasswordStep = 2;
        } else {
          this.forgotPasswordError = res.message || 'לא ניתן לשלוח קוד. נסה שוב.';
        }
      },
      error: (err) => {
        this.sendingCode = false;
        this.forgotPasswordError = err?.error?.message || err?.message || 'שגיאה בשליחת הקוד. ייתכן שהדוא"ל לא רשום.';
      },
    });
  }

  submitNewPassword() {
    const email = this.forgotPasswordEmail?.trim();
    const code = this.forgotPasswordCode?.trim();
    const newPass = this.forgotPasswordNewPass;
    if (!email || !code) {
      this.forgotPasswordError = 'נא להזין דוא"ל וקוד אימות';
      return;
    }
    if (!newPass || newPass.length < 4) {
      this.forgotPasswordError = 'הסיסמה חייבת להכיל לפחות 4 תווים';
      return;
    }
    this.forgotPasswordError = '';
    this.resettingPassword = true;
    this.userSrv.resetPasswordWithCode(email, code, newPass).subscribe({
      next: (res) => {
        this.resettingPassword = false;
        if (res.success) {
          this.forgotPasswordStep = 3;
        } else {
          this.forgotPasswordError = res.message || 'איפוס הסיסמה נכשל. נסה שוב.';
        }
      },
      error: (err) => {
        this.resettingPassword = false;
        this.forgotPasswordError = err?.error?.message || err?.message || 'שגיאה בעדכון הסיסמה. ייתכן שהקוד לא תקף או שפג תוקפו.';
      },
    });
  }

  login() {
    this.loginError.set('');
    if (!this.email?.trim()) {
      this.loginError.set('נא להזין כתובת דוא"ל');
      return;
    }
    if (!this.pass?.trim()) {
      this.loginError.set('נא להזין סיסמה');
      return;
    }
    this.userSrv.login(this.email, this.pass).subscribe({
      next: (res: { status: number; body: any }) => {
        if (res.status === 204) {
          this.loginError.set('כתובת הדוא"ל או הסיסמה שגויים. נסה שוב.');
          return;
        }
        const response = res.body;
        this.authService.login(response.id, response.firstName);
        this.authMessage.showSuccess('התחברת בהצלחה!');
        this.router.navigate(['/shows']);
      },
      error: (err) => {
        const status = err?.status;
        const body = err?.error;
        const msg = typeof body === 'string' ? body : (body?.message ?? body?.error ?? err?.message);
        if (status === 401 || status === 404) {
          this.loginError.set('כתובת הדוא"ל או הסיסמה שגויים. נסה שוב.');
        } else if (msg) {
          this.loginError.set(msg);
        } else {
          this.loginError.set('ההתחברות נכשלה. נסה שוב.');
        }
      },
    });
  }
}
