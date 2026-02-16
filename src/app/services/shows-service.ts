import { inject, Injectable } from '@angular/core';
import { find } from 'rxjs';
import { Category } from '../models/category-model';
import { CategorySrvice } from './category-srvice';
import { Sector, Show, TargetAudience } from '../models/show-model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})

export class ShowsService {
  shows: Show[] = [];
  categories: Category[] = inject(CategorySrvice).categories;
  audiences:TargetAudience[]=Object.values(TargetAudience)
  sectors:Sector[]=Object.values(Sector)
  constructor(private http: HttpClient) {
    this.loadShows();
  }

  private loadShows() {
      return this.http.get('https://localhost:44304/api/Shows');

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

