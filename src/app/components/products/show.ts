import { Component, inject } from '@angular/core';
import { Show } from '../../models/show-model';
import { ShowsService } from '../../services/shows-service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AddShow } from './add-show/add-show';
import { CategorySrvice } from '../../services/category-srvice';
import { DrawerModule } from 'primeng/drawer';
import { ShowShow } from './show-show/show-show';
import { Category } from '../../models/category-model';

@Component({
  selector: 'app-shows',
  imports: [ButtonModule, AddShow, CardModule,DrawerModule,ShowShow],
  templateUrl: './show.html',
  styleUrl: './show.scss',
})
export class ShowsComponent {
  showSrv:ShowsService = inject(ShowsService);
  shows: Show[] = this.showSrv.shows;
  pro:Show = new Show();
  visible: boolean = false;
  pId :number =0
  pTitle:string ='';
  categories: Category[] = inject(CategorySrvice).categories;
  addShow(p: Show){
    p.id = this.shows.length +1;
    this.showSrv.addShow(p);
    this.getAll()
  }
  getAll(){
    this.shows = this.showSrv.shows
  }
  ngOnInit() {
  }
  openShow(id:number){
    this.pId = id;
    this.pTitle = this.showSrv.findShow(id)?.title || '';
    this.visible = true;
  }
}
