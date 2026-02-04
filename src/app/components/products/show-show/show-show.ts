import { Component, Output,EventEmitter, Input, inject} from '@angular/core';
import { ShowsService } from '../../../services/shows-service';
import { Show } from '../../../models/show-model';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-show-show',
  imports: [AvatarModule, ButtonModule],
  templateUrl: './show-show.html',
  styleUrl: './show-show.scss',
})
export class ShowShow {
  showSrv:ShowsService = inject(ShowsService);
  
  @Input()
  showId:number=0;
  
  showProd:Show = new Show()
  userName:string='Michal'
  ngOnChanges(){
    this.showProd = this.showSrv.findShow(this.showId)? this.showSrv.findShow(this.showId)! : new Show();
  }

}
