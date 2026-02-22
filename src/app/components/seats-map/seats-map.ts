import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { interval } from 'rxjs';
import { map, startWith, withLatestFrom } from 'rxjs/operators';
import { ShowsService } from '../../services/shows-service';
import { CartService } from '../../services/cart-service';
import { Seat } from '../../models/seat-model';
import { Show } from '../../models/show-model';

export type SeatState = 'available' | 'in-cart' | 'unavailable';

@Component({
  selector: 'app-seats-map',
  imports: [],
  templateUrl: './seats-map.html',
  styleUrl: './seats-map.scss',
})
export class SeatsMap implements OnInit {
  private showSrv: ShowsService = inject(ShowsService);
  private cartSrv: CartService = inject(CartService);
  private cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  /** The show whose seating we render. For now – first show in list. */
  show: Show | null = null;
  /** Current cart items (subscribed in ngOnInit). */
  cartItems: Seat[] = [];
  /** Seat keys for which a lock request is in progress. */
  pendingKeys = new Set<string>();

  /** Remaining seconds until the soonest-expiring seat; null when cart is empty. */
  remainingSeconds$ = interval(1000).pipe(
    startWith(0),
    withLatestFrom(this.cartSrv.soonestExpiresAt$),
    map(([, soonest]) =>
      soonest == null ? null : Math.max(0, Math.ceil((soonest - Date.now()) / 1000))
    )
  );
  /** Current remaining seconds (set by subscription) so template can show 0. */
  remainingSeconds: number | null = null;

  ngOnInit(): void {
    this.showSrv.shows$.subscribe((shows) => {
      // #region agent log
      const setShow = !this.show && shows.length > 0;
      console.log('[DEBUG] shows$ emission', { showsLength: shows?.length, setShow, showId: setShow ? shows?.[0]?.id : null });
      fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bb2b0'},body:JSON.stringify({sessionId:'9bb2b0',location:'seats-map.ts:ngOnInit.subscribe',message:'shows$ emission',data:{showsLength:shows?.length,setShow,showId:setShow?shows?.[0]?.id:null},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      if (!this.show && shows.length > 0) {
        this.show = shows[0];
        this.cd.detectChanges();
      }
    });
    this.cartSrv.cart$.subscribe((items) => {
      this.cartItems = items;
      this.cd.detectChanges();
    });
    this.remainingSeconds$.subscribe((sec) => {
      this.remainingSeconds = sec;
      this.cd.detectChanges();
    });
  }

  seatKey(seat: Seat): string {
    return `${seat.section}-${seat.row}-${seat.col}`;
  }

  isInCart(seat: Seat): boolean {
    return this.cartItems.some(
      (s) => s.section === seat.section && s.row === seat.row && s.col === seat.col
    );
  }

  isPending(seat: Seat): boolean {
    return this.pendingKeys.has(this.seatKey(seat));
  }

  getSeatState(seat: Seat): SeatState {
    if (this.isInCart(seat)) return 'in-cart';
    if (seat.status) return 'unavailable';
    return 'available';
  }

  onSeatClick(seat: Seat): void {
    const state = this.getSeatState(seat);
    if (state !== 'available' || this.isPending(seat)) return;
    const key = this.seatKey(seat);
    this.pendingKeys.add(key);
    this.cd.detectChanges();
    this.cartSrv.addSeat(seat).subscribe({
      next: () => {
        this.pendingKeys.delete(key);
        this.cd.detectChanges();
      },
      error: () => {
        this.pendingKeys.delete(key);
        this.cd.detectChanges();
      },
    });
  }

  getSeatTitle(seat: Seat, price: number | null | undefined): string {
    const position = `שורה ${seat.row + 1}, כיסא ${seat.col + 1}`;
    const base = `${position} • ${seat.section}`;
    const p = price != null && price > 0 ? `${price} ₪` : '';

    const state = this.getSeatState(seat);
    if (state === 'in-cart') return p ? `${base} • ${p} • נבחר על ידך` : `${base} • נבחר על ידך`;
    if (state === 'unavailable') return p ? `${base} • ${p} • לא זמין` : `${base} • לא זמין`;
    return p ? `${base} • ${p} • פנוי` : `${base} • פנוי`;
  }

  formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
