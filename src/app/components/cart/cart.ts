import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart-service';
import { ShowsService } from '../../services/shows-service';
import { Seat } from '../../models/seat-model';
import { Show } from '../../models/show-model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

export type CartSeatStatus = 'saved' | 'available' | 'unavailable';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, DatePipe],
  templateUrl: './cart.html',
  styleUrls: ['./cart.scss'],
})
export class CartComponent implements OnInit {
  private cartSrv = inject(CartService);
  private showSrv = inject(ShowsService);

  cartItems: Seat[] = [];
  isLoggedIn = false;

  ngOnInit(): void {
    this.isLoggedIn = this.cartSrv.isLoggedIn;
    if (this.isLoggedIn) {
      this.cartSrv.loadCartFromUser(true);
    }
    this.cartSrv.cart$.subscribe((items) => {
      this.cartItems = items;
      if (items.some((s) => s.showId != null)) {
        this.showSrv.getFilteredShows({});
      }
    });
  }

  get totalToPay(): number {
    return this.cartItems.reduce((sum, s) => sum + this.getSeatPrice(s), 0);
  }

  getShow(showId: number | undefined): Show | undefined {
    if (showId == null) return undefined;
    return this.showSrv.findShow(showId);
  }

  /** Display price: seat.price or show's section price. */
  getSeatPrice(seat: Seat): number {
    if (seat.price != null && seat.price > 0) return seat.price;
    const show = this.getShow(seat.showId);
    return this.showSrv.getSectionPrice(show ?? null, seat.section);
  }

  removeSeat(seat: Seat): void {
    this.cartSrv.removeSeat(seat);
  }

  /** Status for display: saved = שמור לך!, available = זמין, unavailable = לא זמין. */
  getSeatStatus(_seat: Seat): CartSeatStatus {
    
    const isInCart = this.cartItems.find(s => s.id === _seat.id);
      if (isInCart) return 'saved';

    //בדיקה אם המושב תפוס על ידי מישהו אחר (דרך המידע מהמופע)
    const show = this.showSrv.shows.find(s => s.id === (_seat.showId ?? 0));
    if (show && show.orderedSeats) {
      let occupied = false;
      for (const order of show.orderedSeats) {
        if (order.orderUserId !== this.cartSrv.getCurrentUserId()) {
          const foundSeat = show.orderedSeats?.find((os: any) => 
            os.col === _seat.col && os.row === _seat.row && os.sectionId === _seat.sectionId
          );
          if (foundSeat) {
            occupied = true;
            break;
          }
        }
      }
      if (occupied) return 'unavailable';
    }

    return 'available';
  }

  goToPayment(): void {
    if (!this.isLoggedIn) return;
  }

  seatKey(seat: Seat): string {
    return `${seat.section}-${seat.row}-${seat.col}-${seat.id ?? ''}`;
  }
}
