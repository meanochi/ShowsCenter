import { Component } from '@angular/core';
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
    this.checkLoginStatus();
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
