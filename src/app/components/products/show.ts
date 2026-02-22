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
import { SelectItem } from 'primeng/api';
import { DataViewModule } from 'primeng/dataview';
import { SelectModule } from 'primeng/select';
import { Observable } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { ImageService } from '../../services/image-service';

@Component({
  selector: 'app-shows',
  imports: [
    ButtonModule,
    AddShow,
    CardModule,
    DrawerModule,
    ShowShow,
    CarouselModule,
    CheckboxModule,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SliderModule,
    DatePipe,
    CommonModule,
    DataViewModule,
    SelectModule,
  ],
  templateUrl: './show.html',
  styleUrl: './show.scss',
})
export class ShowsComponent {
  readonly TargetAudience = TargetAudience;
  readonly Sector = Sector;
  showSrv: ShowsService = inject(ShowsService);
  shows$: Observable<Show[]> = this.showSrv.shows$;
  shows: Show[] = this.showSrv.shows;
  pro: Show = new Show();
  visible: boolean = false;
  pId: number = 0;
  pTitle: string = '';
  categories: Category[] = inject(CategorySrvice).categories;
  audiences: TargetAudience[] = this.showSrv.audiences;
  sectors: Sector[] = this.showSrv.sectors;
  selectedCategories: any[] = [];
  selectedAudiences: any[] = [];
  priceRange: number[] = [0, 1000];
  selectedSectors: any[] = [];
  searchTerm: string = '';
  responsiveOptions: any;
  sortOptions: SelectItem[] = [];
  sortOrder: number = 1;
  sortField: string = 'title';
  upcomingShows: Show[] = [];
  private cd = inject(ChangeDetectorRef);
  imageSrv: ImageService = inject(ImageService);
  /** Called after add-show succeeds; list refreshes when service loadShows() completes (shows$). */
  addShow(_p: Show) {}

  getAll() {
    this.shows = this.showSrv.shows;
  }

  ngOnInit() {
    this.responsiveOptions = [
      {
        breakpoint: '1024px',
        numVisible: 3,
        numScroll: 3,
      },
      {
        breakpoint: '768px',
        numVisible: 2,
        numScroll: 2,
      },
      {
        breakpoint: '560px',
        numVisible: 1,
        numScroll: 1,
      },
    ];

    this.sortOptions = [
      { label: 'תאריך: מהחדש לישן', value: '!date' }, // ה-! מסמן ירידה ב-PrimeNG
      { label: 'תאריך: מהישן לחדש', value: 'date' },
      { label: 'פופולריות', value: '!popularity' },
    ];
    this.prepareUpcomingShows();
    this.shows$.subscribe(() => {
      //this.applyFilters();
      setTimeout(() => {
        this.applyFilters();
        this.cd.detectChanges();
      });
    });
  }
  openShow(id: number) {
    setTimeout(() => {
      this.pId = id;
      this.pTitle = this.showSrv.findShow(id)?.title || '';
      this.visible = true;
      console.log(this.showSrv.findShow(id));
    });
  }
  isManager() {
    return true;
  }
  toChoosePlace(id: number) {}

  prepareUpcomingShows() {
    this.upcomingShows = [...this.showSrv.shows]
      // .filter(s => new Date(s.date) >= new Date()) // אופציונלי: מציג רק אירועים שטרם עברו
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 12);
  }

  onSortChange(event: any) {
    const value = event.value;

    if (value.indexOf('!') === 0) {
      this.sortOrder = -1; // סדר יורד
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = 1; // סדר עולה
      this.sortField = value;
    }
  }

  applyFilters() {
    const filterParams = {
      description: this.searchTerm,
      categoryId: this.selectedCategories, // מערך
      audiences: this.selectedAudiences, // מערך
      sectors: this.selectedSectors, // מערך
      minPrice: this.priceRange[0],
      maxPrice: this.priceRange[1],
      skip: 20, // להתחלה
      position: 1, // כמות להצגה
    }; // קריאה לשירות עם האובייקט
    this.showSrv.getFilteredShows(filterParams);
  }

  getAllShows() {
    return this.showSrv.shows$;
  }
}
