import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** Seat status from DB: 0 = available, 1 = reserved (10 min), 2 = sold. */
export interface SeatStatusDto {
  sectionId: number;
  row: number;
  col: number;
  status: number;
}

@Injectable({
  providedIn: 'root',
})
export class SeatsService {
  constructor(private http: HttpClient) {}

  /**
   * Load seat statuses for a show from the DB.
   * Backend should return array of { sectionId, row, col, status }.
   * status: 0 = available, 1 = reserved, 2 = sold.
   */
  getSeatStatuses(showId: number): Observable<SeatStatusDto[]> {
    return this.http
      .get<SeatStatusDto[]>(`/api/Shows/${showId}/seats`)
      .pipe(catchError(() => of([])));
  }
}
