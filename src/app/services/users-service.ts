import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/user-model';
@Injectable({
  providedIn: 'root',
})

export class UsersService {
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
}
