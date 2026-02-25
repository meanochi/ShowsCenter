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
  categories: Category[] = [];
  audiences:TargetAudience[]=Object.values(TargetAudience)
  sectors:Sector[]=Object.values(Sector)
  // הוסף משתנה BehaviorSubject כדי לנהל את הנתונים
  private showsSubject = new BehaviorSubject<Show[]>([]);
  shows$ = this.showsSubject.asObservable(); // זה מה שהקומפוננטה תירשם אליו
  /** Set when loadShows fails (e.g. 404 – backend not running). Cleared on success. */
  private showsLoadErrorSubject = new BehaviorSubject<string | null>(null);
  showsLoadError$ = this.showsLoadErrorSubject.asObservable();
  constructor(private http: HttpClient, private categorySrv: CategorySrvice) {}

  /** Ensure we always send an array of numbers for category filter (handles object/value quirks). */
  private normalizeCategoryIds(categoryId: unknown): number[] {
    if (categoryId == null) return [];
    if (Array.isArray(categoryId)) {
      return categoryId
        .map((item) => (typeof item === 'number' ? item : (item as { id?: number })?.id))
        .filter((id): id is number => typeof id === 'number' && !isNaN(id));
    }
    const single = typeof categoryId === 'number' ? categoryId : Number(categoryId);
    return !isNaN(single) ? [single] : [];
  }

  private _loadShowsInit() {
    // this.loadShows();
    
    // הזרקת הנתונים מה-Service לתוך המשתנה המקומי
    this.categorySrv.categories$.subscribe(data => {
      this.categories = data;
    });
  }

  public getFilteredShows(filters: any) {
    this.loadShows(filters);
  }

  private loadShows(filters: any = {}) {
    let params = new HttpParams();
    if (filters.description) {
      params = params.set('description', filters.description);
    }

    if (typeof filters.minPrice === 'number') params = params.set('minPrice', filters.minPrice.toString());
    if (typeof filters.maxPrice === 'number') params = params.set('maxPrice', filters.maxPrice.toString());

    params = params.set('skip', filters.skip?.toString() ?? '1000');
    params = params.set('position', filters.position?.toString() ?? '1');

    const categoryIds = this.normalizeCategoryIds(filters.categoryId);
    if (categoryIds.length > 0) {
      categoryIds.forEach((id) => {
        params = params.append('categoryIdS', id.toString());
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
          // Section type = 1 HALL, 2 RIGHT_BALCONY, 3 LEFT_BALCONY, 4 CENTER_BALCONY (not the DB row id)
          show.sectionIdsFromApi = item.sections
            .map((s: any) => Number(s.sectionTypeId ?? s.sectionType ?? s.id))
            .filter((n: number) => !isNaN(n) && n >= 1 && n <= 4);
        item.sections.forEach((sec: any) => {
          const sectionTypeId = Number(sec.sectionTypeId ?? sec.sectionType ?? sec.id);
          const sectionType = SECTION_ID_MAP[sectionTypeId]; 
          
          if (sectionType) {
            const price = typeof sec.price === 'number' ? sec.price : (Number(sec.price) || 0);
            const mapObj = new SeatMap(price, sectionType);
            switch (sectionType) {
              case Section.HALL: show.hallMap = mapObj; break;
              case Section.RIGHT_BALCONY: show.rightBalMap = mapObj; break;
              case Section.LEFT_BALCONY: show.leftBalMap = mapObj; break;
              case Section.CENTER_BALCONY: show.centerBalMap = mapObj; break;
            }
          }
        });
        const sectionPrices = [
          show.hallMap?.price,
          show.leftBalMap?.price,
          show.rightBalMap?.price,
          show.centerBalMap?.price,
        ].filter((p): p is number => typeof p === 'number' && p > 0);
        if (sectionPrices.length > 0 && (show.minPrice == null || show.minPrice === 0)) {
          show.minPrice = Math.min(...sectionPrices);
        }
      }
        return show;
      }))
    ).subscribe({
      next: (shows) => {
        this.showsLoadErrorSubject.next(null);
        this.shows = shows;
        this.showsSubject.next(shows); // עדכון כל מי שמאזין
      },
      error: (error) => {
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
      CategoryId: show.categoryId,
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

  /** Section price for a show (for cart/slider when seat.price is missing). Accepts Section enum or sectionId number. */
  getSectionPrice(show: Show | undefined | null, section: Section | number): number {
    if (!show) return 0;
    const sec: Section = typeof section === 'number' ? (SECTION_ID_MAP[section] ?? Section.HALL) : section;
    if (show.hallMap?.section === sec) {
      const p = show.hallMap?.price;
      return p != null && typeof p === 'number' ? p : (Number(p) || 0);
    }
    if (show.leftBalMap?.section === sec) {
      const p = show.leftBalMap?.price;
      return p != null && typeof p === 'number' ? p : (Number(p) || 0);
    }
    if (show.rightBalMap?.section === sec) {
      const p = show.rightBalMap?.price;
      return p != null && typeof p === 'number' ? p : (Number(p) || 0);
    }
    if (show.centerBalMap?.section === sec) {
      const p = show.centerBalMap?.price;
      return p != null && typeof p === 'number' ? p : (Number(p) || 0);
    }
    return 0;
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

