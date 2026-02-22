import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Seat } from '../models/seat-model';
import { SECTION_TO_ID, SECTION_ID_MAP, Section } from '../models/show-model';

const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export interface LockSeatDTO {
  UserId: number;
  Row: number;
  Col: number;
  sectionId: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly currentUserId = 1;
  private readonly cartSubject = new BehaviorSubject<Seat[]>([]);
  cart$ = this.cartSubject.asObservable();

  private seatTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private seatExpiresAt = new Map<number, number>();
  private readonly soonestExpiresAtSubject = new BehaviorSubject<number | null>(null);
  /** Timestamp (ms) when the seat that expires first will expire. Null if cart is empty. */
  soonestExpiresAt$ = this.soonestExpiresAtSubject.asObservable();

  constructor(private http: HttpClient) {}

  addSeat(seat: Seat): Observable<Seat> {
    const sectionId = SECTION_TO_ID[seat.section];
    const body: LockSeatDTO = {
      UserId: this.currentUserId,
      Row: seat.row,
      Col: seat.col,
      sectionId,
    };
    return this.http.post<Seat & { id: number }>('/api/Order/lock', body).pipe(
      map((created) => {
        const cartSeat: Seat = {
          ...seat,
          id: created.id,
          section: created.section ?? SECTION_ID_MAP[created.section as number] ?? seat.section,
        };
        const cart = [...this.cartSubject.value, cartSeat];
        this.cartSubject.next(cart);
        this.startTimer(cartSeat);
        return cartSeat;
      }),
      tap({
        error: (err) => console.error('CartService addSeat failed', err),
      })
    );
  }

  removeSeat(seat: Seat): void {
    const id = seat.id;
    if (id == null) return;
    this.http
      .delete(`/api/Order/${id}?userId=${this.currentUserId}`)
      .subscribe({
        next: () => {
          this.clearTimer(id);
          const cart = this.cartSubject.value.filter((s) => s.id !== id);
          this.cartSubject.next(cart);
        },
        error: (err) => {
          console.error('CartService removeSeat failed', err);
        },
      });
  }

  private startTimer(seat: Seat): void {
    const id = seat.id;
    if (id == null) return;
    this.clearTimer(id);
    const expiresAt = Date.now() + LOCK_TIMEOUT_MS;
    this.seatExpiresAt.set(id, expiresAt);
    this.soonestExpiresAtSubject.next(this.getSoonestExpiresAt());
    const timerId = setTimeout(() => {
      this.seatTimers.delete(id);
      this.seatExpiresAt.delete(id);
      this.soonestExpiresAtSubject.next(this.getSoonestExpiresAt());
      this.removeSeat(seat);
      alert('The seat reservation has expired.');
    }, LOCK_TIMEOUT_MS);
    this.seatTimers.set(id, timerId);
  }

  private clearTimer(seatId: number): void {
    const existing = this.seatTimers.get(seatId);
    if (existing) {
      clearTimeout(existing);
      this.seatTimers.delete(seatId);
    }
    this.seatExpiresAt.delete(seatId);
    this.soonestExpiresAtSubject.next(this.getSoonestExpiresAt());
  }

  private getSoonestExpiresAt(): number | null {
    const times = [...this.seatExpiresAt.values()];
    return times.length === 0 ? null : Math.min(...times);
  }
}
