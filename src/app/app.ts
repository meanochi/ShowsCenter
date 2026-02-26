import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { AuthMessageService } from './services/auth-message-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('TimeBank');
  protected readonly successMessage = signal<string | null>(null);
  private authMessage = inject(AuthMessageService);
  private sub?: Subscription;
  private hideTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.sub = this.authMessage.message$.subscribe((msg) => {
      this.successMessage.set(msg);
      if (this.hideTimeout) clearTimeout(this.hideTimeout);
      this.hideTimeout = setTimeout(() => this.successMessage.set(null), 4000);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
  }
}
