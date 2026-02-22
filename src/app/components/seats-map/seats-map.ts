import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
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
  private cd: ChangeDetectorRef = inject(ChangeDetectorRef);

  /** The show whose seating we render. For now – first show in list. */
  show: Show | null = null;

  ngOnInit(): void {
    this.showSrv.shows$.subscribe((shows) => {
      // #region agent log
      const setShow = !this.show && shows.length > 0;
      console.log('[DEBUG] shows$ emission', { showsLength: shows?.length, setShow, showId: setShow ? shows?.[0]?.id : null });
      fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bb2b0'},body:JSON.stringify({sessionId:'9bb2b0',location:'seats-map.ts:ngOnInit.subscribe',message:'shows$ emission',data:{showsLength:shows?.length,setShow,showId:setShow?shows?.[0]?.id:null},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      if (!this.show && shows.length > 0) {
        this.show = shows[0];
        this.cd.detectChanges(); // ensure view updates after async emission (avoids NG0100 / stale view)
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
