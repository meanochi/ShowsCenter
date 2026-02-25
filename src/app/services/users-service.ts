import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user-model';
@Injectable({
  providedIn: 'root',
})

export class UsersService {
  user: User = new User()
  login(email: string, pass: string){
    const data = {
      password: pass,
      emailAddress:email
    };
    return this.http.post('/api/Users/loginUser', data);
  }

  signup(user:User){
    return this.http.post('/api/Users/user', user);
  }
  constructor(private http: HttpClient) {}

  /** Get user by id for checkout/profile display. */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`/api/Users/${id}`);
  }

  getUserNameById(id:number){
    this.http.get<User>(`api/Users/${id}`).subscribe((data)=>{
      this.user = data
    })
    return this.user.firstName
  }
}
