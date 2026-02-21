import { Component, EventEmitter, inject, Input, input, Output, signal, ViewChild } from '@angular/core';
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
import { ShowsService } from '../../../services/shows-service';
import { AddProvider } from '../../providers/add-provider/add-provider';
import { ImageService } from '../../../services/image-service';

@Component({
  selector: 'app-add-show',
  imports: [ToggleSwitchModule, RadioButtonModule, ButtonModule ,CommonModule, FormsModule,Dialog, ButtonModule, InputTextModule, AvatarModule,Select,FloatLabelModule,FileUploadModule,InputNumberModule,TextareaModule,DatePickerModule, AddProvider],
  templateUrl: './add-show.html',
  styleUrl: './add-show.scss',
})
export class AddShow {
  readonly TargetAudience = TargetAudience;
  readonly Sector = Sector;
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
    showsSrv: ShowsService = inject(ShowsService)
    submitLoading = false
    submitError: string | null = null
    id: number =0;
    title: string = '';
    date: Date = new Date();
    beginTime: Date = new Date();
    endTime: Date = new Date();
    audience?: TargetAudience;
    sector?: Sector;
    description: string ='';
    imgUrl: string | null = null;
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
    selectedSector: string = '';
    today: Date = new Date().getDate() as unknown as Date;
    checked: boolean[]=[true,false,false,false] 
    imageSrv: ImageService = inject(ImageService);
    imagePreviewSignal = signal<string | ArrayBuffer | null>(null);
    
    showDialog() {
        this.visible = true;
    }
    ngOnInit(){
    this.providerSrv.loadProviders()
    this.providers=this.providerSrv.providers
    this.targetAudienceOptions = Object.keys(TargetAudience)
    .filter(key => isNaN(Number(key))) // מסנן את האינדקסים המספריים
    .map(key => ({
        label: TargetAudience[key as keyof typeof TargetAudience],
        value: key
    }))
    }
    @Output()
    showReady: EventEmitter<Show> = new EventEmitter<Show>();

    private formatTime(value: string | Date | undefined): string {
      if (value == null) return '';
      if (typeof value === 'string') return value.substring(0, 5);
      if (value instanceof Date) {
        const h = value.getHours().toString().padStart(2, '0');
        const m = value.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
      }
      return '';
    }

    addShow(){
      this.submitError = null;
      this.show.minPrice = this.hallMap.price ?? 0;
      if ((this.leftBalMap.price ?? 0) > 0 && (this.show.minPrice === 0 || this.leftBalMap.price! < this.show.minPrice)) {
        this.show.minPrice = this.leftBalMap.price!;
      }
      if ((this.rightBalMap.price ?? 0) > 0 && (this.show.minPrice === 0 || this.rightBalMap.price! < this.show.minPrice)) {
        this.show.minPrice = this.rightBalMap.price!;
      }
      if ((this.centerBalMap.price ?? 0) > 0 && (this.show.minPrice === 0 || this.centerBalMap.price! < this.show.minPrice)) {
        this.show.minPrice = this.centerBalMap.price!;
      }
      this.show.title = this.title;
      this.show.date = this.date;
      this.show.beginTime = new Date(this.formatTime(this.beginTime));
      this.show.endTime = new Date(this.formatTime(this.endTime));
      this.show.audience = this.audience ?? TargetAudience.ADULTS;
      this.show.sector = this.sector ?? Sector.WOMEN;
      this.show.description = this.description;
      this.show.imgUrl = (this.imagePreviewUrl as string) ?? null;
      this.show.providerId = this.providerId;
      this.show.categoryId = this.categoryId;
      this.show.hallMap = this.hallMap;
      this.show.leftBalMap = this.leftBalMap;
      this.show.rightBalMap = this.rightBalMap;
      this.show.centerBalMap = this.centerBalMap;
      if (this.selectedFile) {
        this.imageSrv.upload(this.selectedFile).subscribe({
          next: (res) => {
            console.log('הקובץ נשמר בהצלחה!', res.path);
            this.show.imgUrl = res.path;
            // כאן תוכל לשלוח את res.path ל-Service אחר כדי לשמור ב-DB יחד עם שאר הנתונים
          },
          error: (err) => console.error('שגיאה בהעלאה', err)
        });
      }
      else{
        this.show.imgUrl = null;
      }
      this.submitLoading = true;
      this.showsSrv.addShow(this.show).subscribe({
        next: () => {
          this.showReady.emit(this.show);
          this.reset();
          this.visible = false;
          this.submitLoading = false;
        },
        error: (err) => {
          this.submitLoading = false;
          this.submitError = err?.error?.message ?? err?.message ?? 'שמירת המופע נכשלה';
        },
      });
    }
    reset(){
      this.title = ''
      this.date = new Date()
      this.beginTime = new Date()
      this.endTime = new Date()
      this.audience = undefined;
      this.sector = undefined;
      this.description = '';
      this.imgUrl = null;
      this.providerId = 0;
      this.categoryId = 0;
      this.hallMap = new SeatMap(0, Section.HALL);
      this.leftBalMap = new SeatMap(0, Section.LEFT_BALCONY);
      this.rightBalMap = new SeatMap(0, Section.RIGHT_BALCONY);
      this.centerBalMap = new SeatMap(0, Section.CENTER_BALCONY);
      this.imagePreviewSignal.set(null)
      this.checked.fill(false,1)
      this.providerId = null as unknown as number
      this.show.popularity = 0
      this.show = new Show();
    }
  onFileSelected(event: any): void{
    const files = event.currentFiles || event.files;
        if (event.files && event.files.length > 0) {
          const file = files[0];
          this.imgUrl = file;
          const reader = new FileReader();
        reader.onload = () => {
          this.imagePreviewSignal.set(reader.result);
          this.imagePreviewUrl = reader.result;
        };
        reader.readAsDataURL(file);
  }
}
  removeImage(fileUpload: FileUpload) {
    this.imagePreviewSignal.set(null);
    this.imgUrl = null;
    fileUpload.clear(); 
}
  sectorOptions = Object.keys(Sector)
  .filter(key => isNaN(Number(key)))
  .map(key => ({
    label: Sector[key as keyof typeof Sector],
    value: Sector[key as keyof typeof Sector] // כאן אנחנו שומרים את הערך ("גברים"), לא את המפתח (MEN)
  }));

  @ViewChild('addProviderRef') addProviderRef!: AddProvider;

  openAddProvider() {
    this.addProviderRef?.showDialog();
  }

  onProviderAdded(provider: Provider) {
    this.providerId = provider.id;
    this.providers = this.providerSrv.providers;
  }


}