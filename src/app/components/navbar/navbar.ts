import { afterNextRender, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class NavbarComponent {
  isLoggedIn = false;
  username = 'User';

  constructor(private router: Router) {
    afterNextRender(() => {
      // קוד זה לעולם לא ירוץ בשרת, לכן בטוח להשתמש ב-localStorage
      this.checkLoginStatus();
    });

  }

  checkLoginStatus(): void {
    const userId = localStorage.getItem('user');
    this.isLoggedIn = !!userId;
  }

  logout(): void {
    const confirmed = confirm('Are you sure you want to log out?');
    if (confirmed) {
      localStorage.removeItem('user');
      this.isLoggedIn = false;
      this.router.navigate(['/']);
    }
  }
}
