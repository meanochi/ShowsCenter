import { Component } from '@angular/core';
import { Login } from './login/login';

@Component({
  selector: 'app-users',
  imports: [Login],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {

}
