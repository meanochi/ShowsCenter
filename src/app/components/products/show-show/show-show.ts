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
  providers = this.providerSrv.providers;
  categories = this.categoreySrv.categories;
  readonly Audience = TargetAudience;
  readonly Sector = Sector;
  @Input()
  showId:number=0;
  
  showProd:Show = new Show()
  userName:string='Michal'
  responsiveOptions: any[] | undefined;
  relatedEvents: Show[] = [];
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
  ngOnChanges(){
    this.providers  = this.providerSrv.loadProviders()
    this.showProd = this.showSrv.findShow(this.showId)? this.showSrv.findShow(this.showId)! : new Show();
    this.relatedEvents = this.showSrv.shows.filter(element => 
        element.categoryId === this.showProd.categoryId && element.id !== this.showProd.id
    );
    console.log(this.relatedEvents);
    console.log(this.providers);
    
  }
get endTime(): Date | null {
    if (!this.showProd.beginsAt || !this.showProd.duration || !this.showProd.date) return null;

    const start = new Date(this.showProd.date);
    const startTime = new Date(this.showProd.beginsAt);
    const durationTime = new Date(this.showProd.duration);
    start.setHours(startTime.getHours());
    start.setMinutes(startTime.getMinutes());

    const end = new Date(start);
    end.setHours(start.getHours() + durationTime.getHours());
    end.setMinutes(start.getMinutes() + durationTime.getMinutes());

    return end;
}

get endsNextDay(): boolean {
    const end = this.endTime;
    if (!end || !this.showProd.date) return false;
    
    const startDate = new Date(this.showProd.date).getDate();
    return end.getDate() !== startDate;
}

}
