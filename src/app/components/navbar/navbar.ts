import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  
  isLoggedIn: boolean = false;
  userName: string = 'אורח';

  ngOnInit() {
    this.checkLoginStatus();
  }

  // פונקציה שבודקת האם המשתמש מחובר
  checkLoginStatus() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.isLoggedIn = true;
      // אם שמרת גם את שם המשתמש בלוקל סטורג', אפשר לשלוף אותו כאן. אחרת נציג משתמש:
      this.userName = localStorage.getItem('userName') || 'משתמש'; 
    } else {
      this.isLoggedIn = false;
    }
  }

  // פונקציית התנתקות
  logout() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
      // מחיקת הנתונים מהלוקל סטורג'
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      
      // עדכון הסטטוס כדי שהתצוגה תשתנה מיד
      this.checkLoginStatus();
      
      // ניתוב חזרה לדף הבית
      this.router.navigate(['/']);
    }
  }
}