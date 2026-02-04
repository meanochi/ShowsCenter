import { Component, EventEmitter, inject, Input, input, Output } from '@angular/core';
import { Sector, Show, TargetAudience } from '../../../models/show-model';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms'
import { CategorySrvice } from '../../../services/category-srvice';
import { Category } from '../../../models/category-model';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { Select } from 'primeng/select';
import { FloatLabelModule } from "primeng/floatlabel"
import { FileUpload, FileUploadEvent, FileUploadHandlerEvent, FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SeatMap } from '../../../models/map-model';

@Component({
  selector: 'app-add-show',
  imports: [CommonModule, FormsModule,Dialog, ButtonModule, InputTextModule, AvatarModule,Select,FloatLabelModule,FileUploadModule,InputNumberModule,TextareaModule],
  templateUrl: './add-show.html',
  styleUrl: './add-show.scss',
})
export class AddShow {
    show: Show = new Show();
    categorySrv: CategorySrvice  = inject(CategorySrvice)
    categories: Category[] = this.categorySrv.categories
    id: number =0;
    title: string = '';
    date: Date = new Date();
    beginsAt: string = '';
    duration: number = 0;
    audience?: TargetAudience;
    sector? : Sector;
    description: string ='';
    imageUrl: string | null = null;
    providerId: number =0;
    categoryId: number =0;
    hallMap?:SeatMap;
    leftBalMap?:SeatMap;
    rightBalMap?:SeatMap;
    centerBalMap?:SeatMap;
    userName:string ='Michal';
    imagePreviewUrl: string | ArrayBuffer | null = null;
    selectedFile:any;
    visible: boolean = false;


    showDialog() {
        this.visible = true;
    }
    ngOnInit(){
      this.categorySrv.addCategory("הקרנה")
      this.categorySrv.addCategory("הרצאה")
      this.categorySrv.addCategory("הופעה מוזיקלית")

    }
    @Output()
    showReady: EventEmitter<Show> = new EventEmitter<Show>();

    addShow(){  
      this.show.title = this.title
      this.show.date = this.date
      this.show.beginsAt = this.beginsAt
      this.show.duration = this.duration
      this.show.audience = this.audience
      this.show.sector = this.sector
      this.show.description = this.description
      this.show.imageUrl = this.imageUrl
      this.show.providerId = this.providerId
      this.show.categoryId = this.categoryId
      this.show.hallMap = this.hallMap
      this.show.leftBalMap = this.leftBalMap
      this.show.rightBalMap = this.rightBalMap
      this.show.centerBalMap = this.centerBalMap 
      this.showReady.emit(this.show);
      this.reset();
    }
    reset(){
      this.title = ''
      this.date = new Date()
      this.beginsAt = ''
      this.duration = 0;
      this.audience = undefined;
      this.sector = undefined;
      this.description = '';
      this.imageUrl = null;
      this.providerId = 0;
      this.categoryId = 0;
      this.hallMap = undefined;
      this.leftBalMap = undefined;
      this.rightBalMap = undefined;
      this.centerBalMap = undefined;
      this.show = new Show();
    }
  onFileSelected(event: any): void{
    const files = event.currentFiles || event.files;
        if (event.files && event.files.length > 0) {
          const file = files[0];
          this.imageUrl = file;
          const reader = new FileReader();
        reader.onload = () => {
            this.imagePreviewUrl = reader.result;
        };
        reader.readAsDataURL(file);
  }
}
  removeImage(fileUpload: FileUpload) {
    this.imagePreviewUrl = null;
    this.imageUrl = null;
    fileUpload.clear(); 
}

}