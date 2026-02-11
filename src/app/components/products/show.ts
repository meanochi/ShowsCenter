import { Component, inject } from '@angular/core';
import { Sector, Show, TargetAudience } from '../../models/show-model';
import { ShowsService } from '../../services/shows-service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AddShow } from './add-show/add-show';
import { CategorySrvice } from '../../services/category-srvice';
import { DrawerModule } from 'primeng/drawer';
import { ShowShow } from './show-show/show-show';
import { Category } from '../../models/category-model';
import { CommonModule, DatePipe } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { SliderModule } from 'primeng/slider';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-shows',
  imports: [ButtonModule, AddShow, CardModule,DrawerModule,ShowShow,CarouselModule,CheckboxModule,FormsModule,InputTextModule,IconFieldModule,InputIconModule,SliderModule,DatePipe,CommonModule],
  templateUrl: './show.html',
  styleUrl: './show.scss',
})
export class ShowsComponent {
  readonly TargetAudience = TargetAudience;
  readonly Sector = Sector;
  showSrv:ShowsService = inject(ShowsService);
  shows: Show[] = this.showSrv.shows;
  pro:Show = new Show();
  visible: boolean = false;
  pId :number =0
  pTitle:string ='';
  categories: Category[] = inject(CategorySrvice).categories;
  audiences: TargetAudience[]=this.showSrv.audiences
  sectors:Sector[]=this.showSrv.sectors
  selectedCategories: any[] = [];
  selectedAudiences: any[] = [];
  priceRange: number[] = [0, 1000];
  selectedSectors: any[] = [];
  searchTerm:string=''
  responsiveOptions:any
  addShow(p: Show){
    p.id = this.shows.length +1;
    this.showSrv.addShow(p);
    this.getAll()
  }
  getAll(){
    this.shows = this.showSrv.shows
  }
  ngOnInit() {
        this.responsiveOptions = [
      {
          breakpoint: '1024px',
          numVisible: 3,
          numScroll: 3
      },
      {
          breakpoint: '768px',
          numVisible: 2,
          numScroll: 2
      },
      {
          breakpoint: '560px',
          numVisible: 1,
          numScroll: 1
      }
    ];
  }
  openShow(id:number){
    this.pId = id;
    this.pTitle = this.showSrv.findShow(id)?.title || '';
    this.visible = true;
    console.log(this.showSrv.findShow(id));
    
  }
  isManager(){
    return false;
  }
  toChoosePlace(id:number){

  }
    filterShowsByCategories() {
    if (this.selectedCategories.length === 0) {
        this.shows = this.showSrv.shows; 
    } else {
        this.shows = this.showSrv.shows.filter(s => 
            this.selectedCategories.includes(s.categoryId)
        );
    }
  }
  filterShowsByAudiences() {
    if (this.selectedAudiences.length === 0) {
        this.shows = this.showSrv.shows; 
    } else {
        this.shows = this.showSrv.shows.filter(a => 
            this.selectedAudiences.includes(a)
        );
    }
  }
  filterShowsBySectors() {
    if (this.selectedSectors.length === 0) {
        this.shows = this.showSrv.shows; 
    } else {
        this.shows = this.showSrv.shows.filter(s => 
            this.selectedSectors.includes(s)
        );
    }
  }
  filterByPrice() {
    this.shows = this.showSrv.shows.filter(s => 
        (s.hallMap?.price??0) >= this.priceRange[0] && (s.hallMap?.price??0) <= this.priceRange[1]
    );
  }
  onSearch() {
    this.shows = this.showSrv.shows.filter(s => 
        s.title.toLowerCase().includes(this.searchTerm.toLowerCase()) 
    );
  }
}
