import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ShowsComponent } from './components/products/show';
import { SignIn } from './components/sign-in/sign-in';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShowsComponent, ButtonModule, SignIn],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('TimeBank');
}
