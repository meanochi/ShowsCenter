import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthMessageService {
  private messageSubject = new Subject<string>();
  message$ = this.messageSubject.asObservable();

  showSuccess(message: string): void {
    this.messageSubject.next(message);
  }
}
