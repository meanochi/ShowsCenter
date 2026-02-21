import { Component, OnInit, DoCheck, inject } from '@angular/core';
import { ShowsService } from '../../services/shows-service';
import { Seat } from '../../models/seat-model';
import { Show } from '../../models/show-model';

@Component({
  selector: 'app-seats-map',
  imports: [],
  templateUrl: './seats-map.html',
  styleUrl: './seats-map.scss',
})
export class SeatsMap implements OnInit, DoCheck {
  private showSrv: ShowsService = inject(ShowsService);

  /** The show whose seating we render. For now – first show in list. */
  show: Show | null = null;

  ngOnInit(): void {
    this.showSrv.shows$.subscribe((shows) => {
      // #region agent log
      const hadShow = !!this.show;
      const willSet = !this.show && shows.length > 0;
      fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5a8230'},body:JSON.stringify({sessionId:'5a8230',location:'seats-map.ts:subscribe',message:'shows$ emit',data:{hadShow,showsLength:shows.length,willSet},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      if (!this.show && shows.length) {
        this.show = shows[0];
        // #region agent log
        fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5a8230'},body:JSON.stringify({sessionId:'5a8230',location:'seats-map.ts:after set show',message:'show set to first',data:{showId:this.show?.id},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
      }
    });
  }

  ngDoCheck(): void {
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5a8230'},body:JSON.stringify({sessionId:'5a8230',location:'seats-map.ts:ngDoCheck',message:'CD run',data:{showTruthy:!!this.show},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
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
