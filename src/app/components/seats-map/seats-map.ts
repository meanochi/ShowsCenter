import { Component, OnInit, inject } from '@angular/core';
import { ShowsService } from '../../services/shows-service';
import { Seat } from '../../models/seat-model';
import { Show } from '../../models/show-model';

@Component({
  selector: 'app-seats-map',
  imports: [],
  templateUrl: './seats-map.html',
  styleUrl: './seats-map.scss',
})
export class SeatsMap implements OnInit {
  private showSrv: ShowsService = inject(ShowsService);

  /** The show whose seating we render. For now – first show in list. */
  show: Show | null = null;

  ngOnInit(): void {
    this.showSrv.shows$.subscribe((shows) => {
      if (!this.show && shows.length) {
        // Defer assignment to next turn so it doesn't run after the current change-detection check (fixes NG0100).
        setTimeout(() => {
          this.show = shows[0];
        }, 0);
      }
    });
  }

  getSeatTitle(seat: Seat, price: number | null | undefined): string {
    const position = `שורה ${seat.row + 1}, כיסא ${seat.col + 1}`;
    const base = `${position} • ${seat.section}`;
    const p = price != null && price > 0 ? `${price} ₪` : '';

    if (seat.status) {
      // Occupied / unavailable
      return p ? `${base} • ${p} • לא זמין` : `${base} • לא זמין`;
    }

    return p ? `${base} • ${p} • פנוי` : `${base} • פנוי`;
  }
}
