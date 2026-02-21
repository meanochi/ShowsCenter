import { Component, Output,EventEmitter, Input, inject} from '@angular/core';
import { ShowsService } from '../../../services/shows-service';
import { Sector, Show, TargetAudience } from '../../../models/show-model';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DatePipe } from '@angular/common';
import { ProviderService } from '../../../services/provider-service';
import { CarouselModule } from 'primeng/carousel';
import { CategorySrvice } from '../../../services/category-srvice';
import { ProgressSpinnerModule } from 'primeng/progressspinner'; //
import { Provider } from '../../../models/provider-model';
import { Observable } from 'rxjs';
import { ImageService } from '../../../services/image-service';
@Component({
  selector: 'app-show-show',
  imports: [ AvatarModule, ButtonModule, DatePipe,CarouselModule,AvatarModule, ProgressSpinnerModule],
  templateUrl: './show-show.html',
  styleUrl: './show-show.scss',
})
export class ShowShow {
  showSrv:ShowsService = inject(ShowsService);
  categoreySrv: CategorySrvice = inject(CategorySrvice)
  providerSrv:ProviderService = inject(ProviderService);
  providers:Provider[]=[]
  providers$: Observable<Provider[]> | undefined;
  categories = this.categoreySrv.categories;
  readonly Audience = TargetAudience;
  readonly Sector = Sector;
  currProvider: Provider | undefined
  imageSrv: ImageService = inject(ImageService);
  @Input()
  showId:number=0;
  
  showProd:Show = new Show()
  userName:string='Michal'
  responsiveOptions: any[] | undefined;
  relatedEvents: Show[] = [];
  ngOnInit() {
    this.loadProviders()
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
  ngOnChanges(){
    this.loadProviders()
    console.log(this.providers);
    this.showProd = this.showSrv.findShow(this.showId)? this.showSrv.findShow(this.showId)! : new Show();
    this.relatedEvents = this.showSrv.shows.filter(element => 
        element.categoryId === this.showProd.categoryId && element.id !== this.showProd.id
    );
    console.log(this.relatedEvents);
    console.log(this.providers);
  }

// get (): Date | null {
//     if (!this.showProd.beginTime || !this.showProd.endTime || !this.showProd.date) return null;
//     const start = new Date(this.showProd.date);
//     const startTime = new Date(this.showProd.beginTime);
//     const Time = new Date(this.showProd.endTime);
//     start.setHours(startTime.getHours());
//     start.setMinutes(startTime.getMinutes());
//     const end = new Date(start);
//     end.setHours(start.getHours() + Time.getHours());
//     end.setMinutes(start.getMinutes() + Time.getMinutes());
//     return end;
// }

get endsNextDay(): boolean {
    const end = this.showProd.endTime;
    if (!end || !this.showProd.date) return false;
    
    const startDate = new Date(this.showProd.date).getDate();
    return new Date(end).getDate() !== startDate;
}
get currentProvider() {
  this.loadProviders()
    return this.providers.find(p => p.id === this.showProd.providerId);
}
private loadProviders() {
  this.providerSrv.loadProviders().subscribe({
    next: (providers) => {
      this.providers = providers;
    },
    error: (err) => {
      console.error('Error loading providers', err);
    },
  });
}
}
