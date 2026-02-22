import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Category } from '../models/category-model';
import { CategorySrvice } from './category-srvice';
import { Sector, Show, TargetAudience, SECTION_ID_MAP, Section } from '../models/show-model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, tap, catchError } from 'rxjs/operators';
import { SeatMap } from '../models/map-model';

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
  /** Set when loadShows fails (e.g. 404 – backend not running). Cleared on success. */
  private showsLoadErrorSubject = new BehaviorSubject<string | null>(null);
  showsLoadError$ = this.showsLoadErrorSubject.asObservable();
  constructor( private http: HttpClient) {
    this.loadShows();
  }

  public getFilteredShows(filters: any) {
    this.loadShows(filters);
  }

  private loadShows(filters: any = {}) {
    // #region agent log
    console.log('[DEBUG] loadShows started');
    fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bb2b0'},body:JSON.stringify({sessionId:'9bb2b0',location:'shows-service.ts:loadShows',message:'loadShows started',data:{},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    let params = new HttpParams();
    if (filters.description) {
      params = params.set('description', filters.description);
    }

    if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());

    params = params.set('skip', filters.skip?.toString() || '10');
    params = params.set('position', filters.position?.toString() || '1');

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
        // #region agent log
        console.log('[DEBUG] shows loaded', { count: shows?.length, firstId: shows?.[0]?.id });
        fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bb2b0'},body:JSON.stringify({sessionId:'9bb2b0',location:'shows-service.ts:loadShows.next',message:'shows loaded',data:{count:shows?.length,firstId:shows?.[0]?.id},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        this.showsLoadErrorSubject.next(null);
        this.shows = shows;
        this.showsSubject.next(shows); // עדכון כל מי שמאזין
      },
      error: (error) => {
        // #region agent log
        console.log('[DEBUG] shows load failed', error?.message || error);
        fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bb2b0'},body:JSON.stringify({sessionId:'9bb2b0',location:'shows-service.ts:loadShows.error',message:'shows load failed',data:{err:error?.message||String(error)},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        console.error('Error loading shows:', error);
        const msg = error?.status === 404
          ? 'שרת ה-API לא זמין (404). וודא שהשרת רץ ב־https://localhost:44304'
          : (error?.error?.message || error?.message || 'טעינת המופעים נכשלה');
        this.showsLoadErrorSubject.next(msg);
        // אם יש שגיאה, עדכון עם מערך ריק כדי לא לשבור את הקומפוננטות
        this.showsSubject.next([]);
      }
    });
  }
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
    const show:Show | undefined =this.shows.find(p=>p.id===id)
    return show
  }
  categoryById(id:number){
    return this.categories.find(c=>c.id === id)?.name
}
showsFromProvider(providerId:number){
  return this.shows.filter(p=>p.providerId === providerId)
}
showsFromCategory(categoryId:number){
  return this.shows.filter(p=>p.categoryId === categoryId)
}

}

