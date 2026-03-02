import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Seat } from '../models/seat-model';
import { SECTION_TO_ID, SECTION_ID_MAP, Section } from '../models/show-model';
import { UsersService } from './users-service';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export interface LockSeatDTO {
  userId: number;   // שונה מ-UserId
  showId: number;   // שונה מ-ShowId
  row: number;
  col: number;
  sectionId: number;
  status: number;
}

/** Response from POST /api/Order/confirm */
export interface ConfirmOrderResponse {
  orderId?: number | string;
  confirmationCode?: string;
  date?: string;
}

interface NormalizedOrderItem {
  id: number;
  showId: number;
  sectionSectionType: number;
  sectionId:number,
  row: number;
  col: number;
  status: number;
  price: number;
  userId: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private loadedCartUserId = 0;

  private get currentUserId(): number {
    if (isPlatformBrowser(this.platformId)) {
    const raw = localStorage.getItem('user');
    if (raw == null) return 0;
    try {
      const id = JSON.parse(raw);
      return typeof id === 'number' ? id : Number(id) || 0;
    } catch {
      return 0;
    }
  }
  return 0;
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

  constructor(private http: HttpClient, private usersSrv: UsersService,@Inject(PLATFORM_ID) private platformId: Object) {}

  addSeat(seat: Seat, showId: number, price?: number): Observable<Seat> {
    const uid = this.currentUserId;
    console.log('CartService Debug:', {
        parameterShowId: showId,
        seatObjectShowId: seat.showId,
        userId: uid
    });
    if (uid <= 0) {
      return throwError(() => ({ status: 401, message: 'Login required' }));
    }
    // Send the section's DB row id (sectionDbId), not the section type (1–4).
    const sectionId = seat.sectionSectionType ?? SECTION_TO_ID[seat.section];
    const body: LockSeatDTO = {
      userId: uid,
      showId: showId,   // כאן אנחנו מבטיחים שזה נכנס
      row: seat.row,
      col: seat.col,
      sectionId: sectionId,
      status: 1,
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
    this.loadedCartUserId = 0;
  }

  /**
   * Load cart from server: get user by id, take orders with status 1 (reserved), set cart and start 10-min timers.
   * Call on app/cart init when logged in so cart shows server state.
   */
  loadCartFromUser(force = false): void {
    const uid = this.currentUserId;
    if (uid <= 0) return;
    if (!force && this.loadedCartUserId === uid) return;
    this.usersSrv.getUserById(uid).subscribe({
      next: (user) => {
        const rawOrders =
          (user as unknown as { orders?: unknown; Orders?: unknown })?.orders ??
          (user as unknown as { orders?: unknown; Orders?: unknown })?.Orders ??
          [];
        const orders = Array.isArray(rawOrders) ? rawOrders : [];
        const cartSeats = orders[0].orderedSeats
          .map((o:any) => this.normalizeOrderItem(o, uid))
          .filter((o:any): o is NormalizedOrderItem => o != null && o.status === 1)
          .map((o:any): Seat => {
            const section = SECTION_ID_MAP[o.sectionSectionType as keyof typeof SECTION_ID_MAP] ?? Section.HALL;
            return {
              id: o.id,
              showId: o.showId,
              row: o.row,
              col: o.col,
              sectionId:o.sectionId,
              section:SECTION_ID_MAP[o.sectionSectionType],
              sectionSectionType:o.sectionSectionType,
              price: o.price,
              userId: o.userId ?? uid,
              status: o.status !== 0,
            };
          });
        const previous = this.cartSubject.value;
        for (const seat of previous) {
          if (seat.id != null) this.clearTimer(seat.id);
        }
        this.cartSubject.next(cartSeats);
        for (const seat of cartSeats) {
          this.startTimer(seat);
        }
        this.loadedCartUserId = uid;
      },
      error: (err) => {
        console.error('CartService loadCartFromUser failed', err);
        this.loadedCartUserId = 0;
      },
    });
  }

  private normalizeOrderItem(input: unknown, fallbackUserId: number): NormalizedOrderItem | null {
    if (input == null || typeof input !== 'object') return null;
    const obj = input as Record<string, unknown>;
    const id = this.toNumber(obj['id'] ?? obj['Id'] ?? obj['orderId'] ?? obj['orderedSeatId']);
    const showId = this.toNumber(obj['showId'] ?? obj['ShowId']);
    const sectionId=this.toNumber(obj['SectionId'] ?? obj['sectionId']);
    const sectionSectionType = this.toNumber(obj['sectionSectionType'] ?? obj['sectionTypeId']);    
    const row = this.toNumber(obj['row'] ?? obj['Row']);
    const col = this.toNumber(obj['col'] ?? obj['Col']);
    const status = this.toNumber(obj['status'] ?? obj['Status']);
    const userId = this.toNumber(obj['userId'] ?? obj['UserId']) || fallbackUserId;
    const price = this.toNumber(obj['price'] ?? obj['Price']) || 0;

    if (id <= 0 || showId <= 0 || row < 0 || col < 0 || sectionSectionType <= 0) return null;
    return { id, showId, sectionId,sectionSectionType , row, col, status, userId, price };
  }

  private toNumber(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
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
