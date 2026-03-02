import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { UsersService } from '../../services/users-service';
import { AuthService } from '../../services/auth-service';
import { Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private navSubscription?: Subscription;
  userSrv: UsersService = inject(UsersService)
  // isLoggedIn: boolean = false;
  isLoggedIn = signal<boolean>(false);
  userName: string = 'אורח';
  public authService = inject(AuthService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
  ngOnInit() {
    this.checkLoginStatus();
    this.navSubscription = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.checkLoginStatus());
  }

  ngOnDestroy() {
    this.navSubscription?.unsubscribe();
  }

  // פונקציה שבודקת האם המשתמש מחובר (login שומר ב-'user')
  checkLoginStatus() {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          JSON.parse(raw);
          this.isLoggedIn.set(true);
          this.userName = localStorage.getItem('userName') || 'משתמש';
        } catch {
          this.isLoggedIn.set(false);
        }
      } else {
        this.isLoggedIn.set(false);
      }
    }
  }

  // פונקציית התנתקות
  logout() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {

      this.authService.logout();
      // עדכון הסטטוס כדי שהתצוגה תשתנה מיד
      this.checkLoginStatus();
      
      // ניתוב חזרה לדף הבית
      this.router.navigate(['/']);
    }
  }
}
