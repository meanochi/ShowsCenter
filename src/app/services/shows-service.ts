import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Category } from '../models/category-model';
import { CategorySrvice } from './category-srvice';
import { Sector, Show, TargetAudience,SECTION_ID_MAP, Section } from '../models/show-model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { SeatMap } from '../models/map-model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})

export class ShowsService {
  shows: Show[] = [];
  categories: Category[] = inject(CategorySrvice).categories;
  audiences:TargetAudience[]=Object.values(TargetAudience)
  sectors:Sector[]=Object.values(Sector)
  // הוסף משתנה BehaviorSubject כדי לנהל את הנתונים
  private showsSubject = new BehaviorSubject<Show[]>([]);
  shows$ = this.showsSubject.asObservable(); // זה מה שהקומפוננטה תירשם אליו
  constructor( private http: HttpClient) {
    this.loadShows();
  }

  public getFilteredShows(filters: any) {
    this.loadShows(filters);
}

  private loadShows(filters: any = {}) {
    let params = new HttpParams();
    if (filters.description) {
      params = params.set('description', filters.description);
    }

    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());

    params = params.set('skip', filters.skip?.toString() || '0');
    params = params.set('position', filters.position?.toString() || '10');

    if (filters.categoryId && filters.categoryId.length > 0) {
      filters.categoryId.forEach((id: number) => {
        params = params.append('categoryId', id.toString());
      });
    }

    if (filters.sectors && filters.sectors.length > 0) {
      filters.sectors.forEach((sector: string) => {
        params = params.append('sectors', sector);
      });
    }

    if (filters.audiences && filters.audiences.length > 0) {
      filters.audiences.forEach((audience: string) => {
        params = params.append('audiences', audience);
      });
    }
    this.http.get<any[]>('/api/Shows', { params })
    .pipe(
      map(data => data.map(item => {
        const show = new Show(item);
        show.date = new Date(item.date); 
        if (item.beginTime) show.beginTime = item.beginTime.substring(0, 5);
        if (item.endTime) show.endTime = item.endTime.substring(0, 5);
        if (item.sections && Array.isArray(item.sections)) {
        item.sections.forEach((sec: any) => {
          
          // מציאת סוג ה-Section לפי ה-ID מהשרת
          const sectionType = SECTION_ID_MAP[sec.id]; 
          
          if (sectionType) {
            const mapObj = new SeatMap(sec.totalSeats, sectionType);
            
            // השמה למשתנה הנכון במודל לפי ה-Enum שחזר מהמפה
            switch (sectionType) {
              case Section.HALL: show.hallMap = mapObj; break;
              case Section.RIGHT_BALCONY: show.rightBalMap = mapObj; break;
              case Section.LEFT_BALCONY: show.leftBalMap = mapObj; break;
              case Section.CENTER_BALCONY: show.centerBalMap = mapObj; break;
            }
          }
        });
      }
        return show;
      }))
    ).subscribe({
      next: (shows) => {
        this.shows = shows;
        this.showsSubject.next(shows); // עדכון כל מי שמאזין
      },
      error: (error) => {
        console.error('Error loading shows:', error);
        // אם יש שגיאה, עדכן עם מערך ריק כדי לא לשבור את הקומפוננטות
        this.showsSubject.next([]);
      }
    });
  }

  private saveShows() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('shows', JSON.stringify(this.shows));
    }
  }

  /**
   * Build the request body for POST /api/Shows.
   * Matches server: Title, Date (DateOnly), BeginTime/EndTime (TimeOnly), Audience, Sector, Description, ImgUrl, ProviderId, CategoryId.
   */
  private buildAddShowBody(show: Show): Record<string, unknown> {
    const dateStr = show.date instanceof Date
      ? show.date.toISOString().slice(0, 10)
      : String(show.date).slice(0, 10);
    const beginTimeStr = this.formatTimeForServer(show.beginTime);
    const endTimeStr = this.formatTimeForServer(show.endTime);

    return {
      Title: show.title,
      Date: dateStr,
      BeginTime: beginTimeStr,
      EndTime: endTimeStr,
      Audience: show.audience,
      Sector: show.sector,
      Description: show.description ?? '',
      ImgUrl: show.imgUrl ?? '',
      ProviderId: show.providerId,
      CategoryId: 401,
    };
  }

  private formatTimeForServer(value: string | Date | undefined): string {
    if (value == null) return '';
    if (typeof value === 'string') return value.substring(0, 5);
    if (value instanceof Date) {
      const h = value.getHours().toString().padStart(2, '0');
      const m = value.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    }
    return '';
  }

  /** POST new show to server, then reload shows list. Returns observable for success/error handling. */
  addShow(show: Show): Observable<Show> {
    const userId = localStorage.getItem('user');
    const body = this.buildAddShowBody(show);
    return this.http.post<Show>(`/api/Shows?userId=${userId}`, body).pipe(
      tap(() => this.loadShows()),
      catchError((err) => {
        console.error('addShow failed', err);
        throw err;
      }),
    );
  }

  findShow(id:number){
    this.loadShows({});
    const show:Show | undefined =this.shows.find(p=>p.id===id)
    return show
  }
  categoryById(id:number){
    return this.categories.find(c=>c.id === id)?.name
}
showsFromProvider(providerId:number){
  this.loadShows({});
  return this.shows.filter(p=>p.providerId === providerId)
}
showsFromCategory(categoryId:number){
  this.loadShows({});
  return this.shows.filter(p=>p.categoryId === categoryId)
}

}

