import { Component } from '@angular/core';
import { Login } from './login/login';
import { Signup } from "./signup/signup";

@Component({
  selector: 'app-users',
  imports: [Login, Signup],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
signupVisible:boolean = false;
}
