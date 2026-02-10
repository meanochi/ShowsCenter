import { Component, Output,EventEmitter, Input, inject} from '@angular/core';
import { ShowsService } from '../../../services/shows-service';
import { Show } from '../../../models/show-model';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DatePipe } from '@angular/common';
import { ProviderService } from '../../../services/provider-service';

@Component({
  selector: 'app-show-show',
  imports: [ AvatarModule, ButtonModule, DatePipe],
  templateUrl: './show-show.html',
  styleUrl: './show-show.scss',
})
export class ShowShow {
  showSrv:ShowsService = inject(ShowsService);
  providerSrv:ProviderService = inject(ProviderService);
  providers = this.providerSrv.providers;

  @Input()
  showId:number=0;
  
  showProd:Show = new Show()
  userName:string='Michal'
  ngOnChanges(){
    this.showProd = this.showSrv.findShow(this.showId)? this.showSrv.findShow(this.showId)! : new Show();
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

// פונקציה לבדיקה אם האירוע מסתיים ביום למחרת
get endsNextDay(): boolean {
    const end = this.endTime;
    if (!end || !this.showProd.date) return false;
    
    const startDate = new Date(this.showProd.date).getDate();
    return end.getDate() !== startDate;
}

}
