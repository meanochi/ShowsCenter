import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Seat } from '../models/seat-model';

/** Seat status from DB: 0 = available, 1 = reserved (10 min), 2 = sold. */

@Injectable({
  providedIn: 'root',
})
export class SeatsService {
  constructor(private http: HttpClient) {}

  /** Get ordered (reserved/sold) seats for a show from GET /api/OrderedSeat/showId/{showId}. */
  getOrderedSeats(showId: number): Observable<Seat[]> {
    return this.http.get<any[]>(`/api/OrderedSeat/showId/${showId}`).pipe(
      map((data) =>
        data.map((dto) => {
          const seat = new Seat();
          seat.id = dto.id;
          seat.row = dto.row;
          seat.col = dto.col;
          seat.userId = dto.userId ?? 0;
          /** 1 = reserved, 2 = sold => unavailable on map */
          seat.status = dto.status === 1 || dto.status === 2;
          seat.sectionDbId = dto.sectionSectionType;
          return seat;
        })
      )
    );
  }
}

