import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Seat } from '../models/seat-model';
import { Show, OrderedSeatDto, SECTION_ID_MAP, Section } from '../models/show-model';
import { ShowsService } from './shows-service';

@Injectable({
  providedIn: 'root',
})
export class SeatsService {
  private showSrv = inject(ShowsService);

  /**
   * Get ordered (reserved/sold) seats for a show as Seat[].
   * Uses GET /api/Shows/${showId} which returns a Show object containing orderedSeats;
   * that list is converted to Seat[] (each with status = true for disabled in map).
   */
  getOrderedSeats(showId: number): Observable<Seat[]> {
    return this.showSrv.getShowById(showId).pipe(
      map((show) => this.orderedSeatsToSeatList(show.orderedSeats ?? []))
    );
  }

  /**
   * Convert API ordered-seat DTOs to Seat[] for use in map (each seat has status = true so it is disabled).
   */
  orderedSeatsToSeatList(dtos: OrderedSeatDto[]): Seat[] {
    return dtos.map((dto) => {
      const section: Section = SECTION_ID_MAP[dto.sectionId] ?? Section.HALL;
      const seat = new Seat();
      seat.section = section;
      seat.row = dto.row;
      seat.col = dto.col;
      seat.status = true;
      return seat;
    });
  }
}
