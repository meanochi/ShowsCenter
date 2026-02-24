import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { UsersService } from '../../services/users-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  userSrv: UsersService = inject(UsersService)
  isLoggedIn: boolean = false;
  userName: string = 'אורח';
  public authService = inject(AuthService);
  
  ngOnInit() {
    this.checkLoginStatus();
  }

  logout() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
      this.authService.logout(); // קוראים לפונקציה מהסרוויס
      this.router.navigate(['/']);
    }
  }
  // פונקציה שבודקת האם המשתמש מחובר
  checkLoginStatus() {
    const userId = localStorage.getItem('user');
    if (userId) {
      this.isLoggedIn = true;
      // אם שמרת גם את שם המשתמש בלוקל סטורג', אפשר לשלוף אותו כאן. אחרת נציג משתמש:
      this.userName =this.userSrv.getUserNameById(Number(localStorage.getItem('user'))) || 'משתמש'; 
    } else {
      this.isLoggedIn = false;
    }
  }

}