import { inject, Injectable } from '@angular/core';
import { find } from 'rxjs';
import { Category } from '../models/category-model';
import { CategorySrvice } from './category-srvice';
import { Sector, Show, TargetAudience,SECTION_ID_MAP, Section } from '../models/show-model';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { SeatMap } from '../models/map-model';

@Injectable({
  providedIn: 'root',
})
export class ShowsService {
  shows: Show[] = [];
  categories: Category[] = inject(CategorySrvice).categories;
  audiences:TargetAudience[]=Object.values(TargetAudience)
  sectors:Sector[]=Object.values(Sector)
  constructor( private http: HttpClient) {
    this.loadShows();
  }

  private loadShows() {
    // if (typeof localStorage !== 'undefined') {
    //   const stored = localStorage.getItem('shows');
    //   if (stored) {
    //     this.shows = JSON.parse(stored);
    //   }
    // }   
    this.http.get<any[]>('https://localhost:44304/api/Shows')
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
    ).subscribe(shows => {
      this.shows = shows;
    });
  }

  private saveShows() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('shows', JSON.stringify(this.shows));
    }
  }
  
  addShow(show: Show) {
    this.shows.push(show);
    this.saveShows();
  }

  findShow(id:number){
    this.loadShows();
    const show:Show | undefined =this.shows.find(p=>p.id===id)
    return show
  }
  categoryById(id:number){
    return this.categories.find(c=>c.id === id)?.name
}
showsFromProvider(providerId:number){
  this.loadShows();
  return this.shows.filter(p=>p.providerId === providerId)
}
showsFromCategory(categoryId:number){
  this.loadShows();
  return this.shows.filter(p=>p.categoryId === categoryId)
}

}

