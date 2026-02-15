import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ShowsComponent } from './components/products/show';
import { Users } from './components/users/users';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShowsComponent, ButtonModule, Users],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('TimeBank');
}
