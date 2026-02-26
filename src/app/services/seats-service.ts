import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { Seat } from '../models/seat-model'
/** Seat status from DB: 0 = available, 1 = reserved (10 min), 2 = sold. */

@Injectable({
  providedIn: 'root',
})
export class SeatsService {
  constructor(private http: HttpClient) {}
// בתוך ה-Service שלך
getOrderedSeats(showId:number): Observable<Seat[]> {
  return this.http.get<any[]>(`/api/OrderedSeat/showId/${showId}`).pipe(
    map(data => data.map(dto => {
      const seat = new Seat();
      
      seat.id = dto.id;
      seat.row = dto.row;
      seat.col = dto.col;
      seat.userId = dto.userId;

      seat.status = dto.status === 1; 
      seat.sectionDbId = dto.sectionSectionType;  

      return seat;
    }))
  );
}
  }

