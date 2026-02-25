import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // יוצרים סיגנלים ומאתחלים אותם לפי מה שיש בלוקל סטורג'
  isLoggedIn = signal<boolean>(!!localStorage.getItem('userId'));
  userName = signal<string>(localStorage.getItem('userName') || 'אורח');

  // פונקציה מסודרת להתחברות
  login(id: string, name: string) {
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', name);
    
    // מעדכנים את הסיגנלים - כל מי שקורא אותם יתעדכן מיד!
    this.isLoggedIn.set(true);
    this.userName.set(name);
  }

  // פונקציה מסודרת להתנתקות
  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    
    this.isLoggedIn.set(false);
    this.userName.set('אורח');
  }
}