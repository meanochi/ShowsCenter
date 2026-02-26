import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { User } from '../../models/user-model';
import { UsersService } from '../../services/users-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-personal-area',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    FloatLabel,
    PasswordModule,
  ],
  templateUrl: './personal-area.html',
  styleUrls: ['./personal-area.scss'],
})
export class PersonalAreaComponent implements OnInit {
  private usersSrv = inject(UsersService);
  private authSrv = inject(AuthService);

  user = signal<User | null>(null);
  loadError = signal<string | null>(null);
  saveMessage = signal<'success' | 'error' | null>(null);
  saving = signal(false);

  /** Form model for editing (copy so we don't mutate loaded user until save). */
  editUser: User = new User();
  /** Optional new password; only sent when user types something. */
  newPassword = '';

  private trimUser(u: User): User {
    return {
      ...u,
      firstName: (u.firstName ?? '').trim(),
      lastName: (u.lastName ?? '').trim(),
      emailAddress: (u.emailAddress ?? '').trim(),
      phoneNumber: (u.phoneNumber ?? '').trim(),
      password: u.password ?? '',
    };
  }

  ngOnInit(): void {
    const userId = Number(localStorage.getItem('user'));
    if (!userId) {
      this.loadError.set('יש להתחבר כדי לראות את האזור האישי');
      return;
    }
    this.usersSrv.getUserById(userId).subscribe({
      next: (u) => {
        this.user.set(u);
        this.editUser = this.trimUser({ ...u, password: '' });
      },
      error: () => this.loadError.set('לא ניתן לטעון פרטי משתמש'),
    });
  }

  save(): void {
    const u = this.user();
    if (!u?.id) return;
    this.saving.set(true);
    this.saveMessage.set(null);
    const toSend = this.trimUser({ ...this.editUser, id: u.id });
    if (this.newPassword.trim()) toSend.password = this.newPassword.trim();
    this.usersSrv.updateUser(u.id, toSend).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.editUser = this.trimUser({ ...updated, password: '' });
        this.newPassword = '';
        this.authSrv.login(String(updated.id), updated.firstName);
        this.saveMessage.set('success');
        this.saving.set(false);
      },
      error: () => {
        this.saveMessage.set('error');
        this.saving.set(false);
      },
    });
  }
}
