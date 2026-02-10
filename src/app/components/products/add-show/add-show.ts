import { Component, EventEmitter, inject, Input, input, Output } from '@angular/core';
import { Section, Sector, Show, TargetAudience } from '../../../models/show-model';
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
import { DatePickerModule } from 'primeng/datepicker';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ProviderService } from '../../../services/provider-service';
import { Provider } from '../../../models/provider-model';

@Component({
  selector: 'app-add-show',
  imports: [ToggleSwitchModule, RadioButtonModule, ButtonModule ,CommonModule, FormsModule,Dialog, ButtonModule, InputTextModule, AvatarModule,Select,FloatLabelModule,FileUploadModule,InputNumberModule,TextareaModule,DatePickerModule],
  templateUrl: './add-show.html',
  styleUrl: './add-show.scss',
})
export class AddShow {
  targetAudienceOptions = Object.keys(TargetAudience)
    .filter(key => isNaN(Number(key))) // מסנן את האינדקסים המספריים
    .map(key => ({
        label: TargetAudience[key as keyof typeof TargetAudience],
        value: key
    }))
    show: Show = new Show();
    categorySrv: CategorySrvice  = inject(CategorySrvice)
    categories: Category[] = this.categorySrv.categories
    providerSrv: ProviderService  = inject(ProviderService)
    providers: Provider[] = this.providerSrv.providers
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
    categoryId: number = null as unknown as number;
    hallMap:SeatMap = new SeatMap(0, Section.HALL);
    leftBalMap:SeatMap =new SeatMap(0, Section.LEFT_BALCONY);
    rightBalMap:SeatMap =new SeatMap(0, Section.RIGHT_BALCONY);
    centerBalMap:SeatMap =new SeatMap(0, Section.CENTER_BALCONY);
    userName:string ='Michal';
    imagePreviewUrl: string | ArrayBuffer | null = null;
    selectedFile:any;
    visible: boolean = false;
    today: Date = new Date().getDate() as unknown as Date;
    checked: boolean[]=[true,false,false,false] 
    showDialog() {
        this.visible = true;
    }
    ngOnInit(){
    this.targetAudienceOptions = Object.keys(TargetAudience)
    .filter(key => isNaN(Number(key))) // מסנן את האינדקסים המספריים
    .map(key => ({
        label: TargetAudience[key as keyof typeof TargetAudience],
        value: key
    }))
      this.providerSrv.addProvider("טלי אברהמי", "https://serviced.co.il/wp-content/uploads/2022/01/white-%D7%A6%D7%95%D7%A8-%D7%A7%D7%A9%D7%A8-%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%9C%D7%A7%D7%95%D7%97%D7%95%D7%AA-%D7%98%D7%9C%D7%99-%D7%90%D7%91%D7%A8%D7%94%D7%9E%D7%99.jpg")
      this.providerSrv.addProvider("שלום וגשל", "https://vagshal-mp.com/wp-content/uploads/2024/08/Logo_2022-02-300x169.png")
      this.providerSrv.addProvider("בתיה", "https://www.kol-graph.co.il/images/site/home/clientlogo/clientlogo16.png")
      this.categorySrv.addCategory("הקרנה")
      this.categorySrv.addCategory("הרצאה")
      this.categorySrv.addCategory("הופעה מוזיקלית")
    }
    @Output()
    showReady: EventEmitter<Show> = new EventEmitter<Show>();

    addShow(){

      this.show.minPrice = this.hallMap.price
      if(this.leftBalMap.price > 0 && (this.show.minPrice === 0 || this.leftBalMap.price < this.show.minPrice)){
        this.show.minPrice = this.leftBalMap.price
      }
      if(this.rightBalMap.price > 0 && (this.show.minPrice === 0 || this.rightBalMap.price < this.show.minPrice)){
        this.show.minPrice = this.rightBalMap.price
      }
      if(this.centerBalMap.price > 0 && (this.show.minPrice === 0 || this.centerBalMap.price < this.show.minPrice)){
        this.show.minPrice = this.centerBalMap.price
      }
      this.show.title = this.title
      this.show.date = this.date
      this.show.beginsAt = this.beginsAt
      this.show.duration = this.duration
      this.show.audience = this.audience
      this.show.sector = this.sector
      this.show.description = this.description
      this.show.imageUrl = this.imagePreviewUrl as string
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
      this.hallMap = new SeatMap(0, Section.HALL);
      this.leftBalMap = new SeatMap(0, Section.LEFT_BALCONY);
      this.rightBalMap = new SeatMap(0, Section.RIGHT_BALCONY);
      this.centerBalMap = new SeatMap(0, Section.CENTER_BALCONY);
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