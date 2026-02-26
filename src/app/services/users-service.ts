import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../models/user-model';

@Injectable({
  providedIn: 'root',
})

export class UsersService {
  user: User = new User()
  /** Returns status and body so caller can treat 204 as failed login. */
  login(email: string, pass: string): Observable<{ status: number; body: any }> {
    const data = {
      password: pass,
      emailAddress: email
    };
    return this.http.post('/api/Users/loginUser', data, { observe: 'response' }).pipe(
      map(res => ({ status: res.status, body: res.body }))
    );
  }

  /** Request a password-reset code sent to the user's email. */
  requestPasswordResetCode(email: string): Observable<{ sent: boolean; message?: string }> {
    return this.http.post<{ sent: boolean; message?: string }>('/api/Users/forgot-password', { email });
  }

  /** Reset password using the code received by email. */
  resetPasswordWithCode(email: string, code: string, newPassword: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>('/api/Users/reset-password', {
      email,
      code,
      newPassword,
    });
  }

  signup(user:User){
    return this.http.post('/api/Users/user', user);
  }
  constructor(private http: HttpClient) {}

  /** Get user by id for checkout/profile display. */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`/api/Users/${id}`);
  }

  /** Update user details on the server. */
  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`/api/Users/${id}`, user);
  }

  getUserNameById(id:number){
    this.http.get<User>(`api/Users/${id}`).subscribe((data)=>{
      this.user = data
    })
    return this.user.firstName
  }
}
