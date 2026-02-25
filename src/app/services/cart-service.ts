import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Seat } from '../models/seat-model';
import { SECTION_TO_ID, SECTION_ID_MAP, Section } from '../models/show-model';

const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export interface LockSeatDTO {
  UserId: number;
  ShowId: number;
  Row: number;
  Col: number;
  sectionId: number;
  /** 1 = reserved for user (orderedSeats.status in DB). */
  Status: number;
}

/** Response from POST /api/Order/confirm */
export interface ConfirmOrderResponse {
  orderId?: number | string;
  confirmationCode?: string;
  date?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private get currentUserId(): number {
    const raw = localStorage.getItem('user');
    if (raw == null) return 0;
    try {
      const id = JSON.parse(raw);
      return typeof id === 'number' ? id : Number(id) || 0;
    } catch {
      return 0;
    }
  }

  /** Returns current user id if logged in, else 0. */
  getCurrentUserId(): number {
    return this.currentUserId;
  }

  get isLoggedIn(): boolean {
    return this.currentUserId > 0;
  }

  private readonly cartSubject = new BehaviorSubject<Seat[]>([]);
  cart$ = this.cartSubject.asObservable();

  private seatTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private seatExpiresAt = new Map<number, number>();
  private readonly soonestExpiresAtSubject = new BehaviorSubject<number | null>(null);
  /** Timestamp (ms) when the seat that expires first will expire. Null if cart is empty. */
  soonestExpiresAt$ = this.soonestExpiresAtSubject.asObservable();

  constructor(private http: HttpClient) {}

  addSeat(seat: Seat, showId: number, price?: number): Observable<Seat> {
    const uid = this.currentUserId;
    if (uid <= 0) {
      return throwError(() => ({ status: 401, message: 'Login required' }));
    }
    // Send the section's DB row id (sectionDbId), not the section type (1–4).
    const sectionId = seat.sectionDbId ?? SECTION_TO_ID[seat.section];
    const body: LockSeatDTO = {
      UserId: uid,
      ShowId: showId,
      Row: seat.row,
      Col: seat.col,
      sectionId,
      Status: 1,
    };
    return this.http.post<any>('/api/Order/lock', body).pipe(
      map((created) => {
        const serverPrice = created.price != null && typeof created.price === 'number' ? created.price : (Number((created as any).price) || undefined);
        const cartSeat: Seat = {
          ...seat,
          id: created.id,
          showId,
          price: serverPrice ?? price ?? seat.price,
          userId: uid,
          section: created.section != null ? (SECTION_ID_MAP[created.section as number] ?? seat.section) : seat.section,
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
    const uid = this.currentUserId;
    this.clearTimer(id);
    this.http
      .delete(`/api/Order/${id}?userId=${uid}`)
      .subscribe({
        next: () => {
          const cart = this.cartSubject.value.filter((s) => s.id !== id);
          this.cartSubject.next(cart);
        },
        error: (err) => {
          console.error('CartService removeSeat failed', err);
        },
      });
  }

  /**
   * Confirm order (pay): POST to backend with locked order item ids.
   * Backend should create the order and update seat status to sold.
   */
  confirmOrder(orderItemIds: number[]): Observable<ConfirmOrderResponse> {
    const uid = this.currentUserId;
    if (uid <= 0) {
      return throwError(() => ({ status: 401, message: 'Login required' }));
    }
    if (orderItemIds.length === 0) {
      return throwError(() => ({ status: 400, message: 'No items to confirm' }));
    }
    return this.http.post<ConfirmOrderResponse>('/api/Order/confirm', {
      userId: uid,
      orderItemIds,
    }).pipe(
      tap({
        error: (err) => console.error('CartService confirmOrder failed', err),
      })
    );
  }

  /** Clear cart state and all reservation timers (call after successful order). */
  clearCart(): void {
    const cart = this.cartSubject.value;
    for (const seat of cart) {
      if (seat.id != null) this.clearTimer(seat.id);
    }
    this.cartSubject.next([]);
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
    if (existing != null) {
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
