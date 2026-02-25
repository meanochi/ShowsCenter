import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn = signal<boolean>(false);
  userName = signal<string>('אורח');

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
      this.isLoggedIn.set(!!localStorage.getItem('userId'));
      this.userName.set(localStorage.getItem('userName') || 'אורח');
    }
  }

  login(id: string, name: string) {
    if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
      localStorage.setItem('userId', id);
      localStorage.setItem('userName', name);
    }
    this.isLoggedIn.set(true);
    this.userName.set(name);
  }

  logout() {
    if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
    }
    this.isLoggedIn.set(false);
    this.userName.set('אורח');
  }
}