import {
  Component,
  EventEmitter,
  inject,
  Input,
  input,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { Section, Sector, Show, TargetAudience } from '../../../models/show-model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategorySrvice } from '../../../services/category-srvice';
import { Category } from '../../../models/category-model';
import { Dialog } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { Select } from 'primeng/select';
import { FloatLabelModule } from 'primeng/floatlabel';
import {
  FileUpload,
  FileUploadEvent,
  FileUploadHandlerEvent,
  FileUploadModule,
} from 'primeng/fileupload';
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
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-add-show',
  imports: [
    ToggleSwitchModule,
    RadioButtonModule,
    ButtonModule,
    CommonModule,
    FormsModule,
    Dialog,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    Select,
    FloatLabelModule,
    FileUploadModule,
    InputNumberModule,
    TextareaModule,
    DatePickerModule,
    AddProvider,
  ],
  templateUrl: './add-show.html',
  styleUrl: './add-show.scss',
})
export class AddShow {
  readonly TargetAudience = TargetAudience;
  readonly Sector = Sector;
  targetAudienceOptions = Object.keys(TargetAudience)
    .filter((key) => isNaN(Number(key))) // מסנן את האינדקסים המספריים
    .map((key) => ({
      label: TargetAudience[key as keyof typeof TargetAudience],
      value: key,
    }));
  show: Show = new Show();
  categorySrv: CategorySrvice = inject(CategorySrvice);
  categories: Category[] = this.categorySrv.categories;
  providerSrv: ProviderService = inject(ProviderService);
  providers: Provider[] = [];
  showsSrv: ShowsService = inject(ShowsService);
  submitLoading = false;
  submitError: string | null = null;
  id: number = 0;
  title: string = '';
  date: Date = new Date();
  beginTime: Date = new Date();
  endTime: Date = new Date();
  audience?: TargetAudience;
  sector?: Sector;
  description: string = '';
  imgUrl: string | null = null;
  providerId: number = 0;
  categoryId: number = null as unknown as number;
  hallMap: SeatMap = new SeatMap(0, Section.HALL);
  leftBalMap: SeatMap = new SeatMap(0, Section.LEFT_BALCONY);
  rightBalMap: SeatMap = new SeatMap(0, Section.RIGHT_BALCONY);
  centerBalMap: SeatMap = new SeatMap(0, Section.CENTER_BALCONY);
  userName: string = 'Michal';
  imagePreviewUrl: string | ArrayBuffer | null = null;
  selectedFile: any;
  visible: boolean = false;
  selectedSector: string = '';
  today: Date = new Date().getDate() as unknown as Date;
  checked: boolean[] = [true, false, false, false];
  imageSrv: ImageService = inject(ImageService);
  imagePreviewSignal = signal<string | ArrayBuffer | null>(null);
  private cd = inject(ChangeDetectorRef);

  showDialog() {
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bb2b0'},body:JSON.stringify({sessionId:'9bb2b0',location:'add-show.ts:showDialog',message:'dialog opened',data:{visible:true,providersLength:this.providers?.length},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    this.loadProviders(); // ensure providers are loaded when dialog opens (in case ngOnInit load was slow or failed)
    this.visible = true;
  }
  ngOnInit() {
    // #region agent log
    fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bb2b0'},body:JSON.stringify({sessionId:'9bb2b0',location:'add-show.ts:ngOnInit',message:'calling loadProviders',data:{},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    this.loadProviders();
    this.targetAudienceOptions = Object.keys(TargetAudience)
      .filter((key) => isNaN(Number(key))) // מסנן את האינדקסים המספריים
      .map((key) => ({
        label: TargetAudience[key as keyof typeof TargetAudience],
        value: key,
      }));
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
  ngOnChanges() {
  }
  addShow() {
    this.submitError = null;
    this.show.minPrice = this.hallMap.price ?? 0;
    if (
      (this.leftBalMap.price ?? 0) > 0 &&
      (this.show.minPrice === 0 || this.leftBalMap.price! < this.show.minPrice)
    ) {
      this.show.minPrice = this.leftBalMap.price!;
    }
    if (
      (this.rightBalMap.price ?? 0) > 0 &&
      (this.show.minPrice === 0 || this.rightBalMap.price! < this.show.minPrice)
    ) {
      this.show.minPrice = this.rightBalMap.price!;
    }
    if (
      (this.centerBalMap.price ?? 0) > 0 &&
      (this.show.minPrice === 0 || this.centerBalMap.price! < this.show.minPrice)
    ) {
      this.show.minPrice = this.centerBalMap.price!;
    }
    this.show.title = this.title;
    this.show.date = this.date;
    this.show.beginTime = this.beginTime;
    this.show.endTime = this.endTime;
    this.show.audience = this.audience ?? TargetAudience.ADULTS;
    this.show.sector = this.sector ?? Sector.WOMEN;
    this.show.description = this.description;
    this.show.providerId = this.providerId;
    this.show.categoryId = this.categoryId;
    this.show.hallMap = this.hallMap;
    this.show.leftBalMap = this.leftBalMap;
    this.show.rightBalMap = this.rightBalMap;
    this.show.centerBalMap = this.centerBalMap;
    this.submitLoading = true;
    if (this.selectedFile) {
      this.imageSrv.upload(this.selectedFile).subscribe({
        next: (res) => {
          this.show.imgUrl = res.path;
          this.sendShowToServer();
        },
        error: (err) => {
          console.error('שגיאה בהעלאה', err);
          this.submitLoading = false;
          this.submitError = err?.error?.message ?? err?.message ?? 'העלאת התמונה נכשלה';
        },
      });
    } else {
      this.show.imgUrl = null;
      this.sendShowToServer();
    }
  }

  private sendShowToServer(): void {
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
  reset() {
    this.title = '';
    this.date = new Date();
    this.beginTime = new Date();
    this.endTime = new Date();
    this.audience = undefined;
    this.sector = undefined;
    this.description = '';
    this.imgUrl = null;
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.providerId = 0;
    this.categoryId = 0;
    this.hallMap = new SeatMap(0, Section.HALL);
    this.leftBalMap = new SeatMap(0, Section.LEFT_BALCONY);
    this.rightBalMap = new SeatMap(0, Section.RIGHT_BALCONY);
    this.centerBalMap = new SeatMap(0, Section.CENTER_BALCONY);
    this.imagePreviewSignal.set(null);
    this.checked.fill(false, 1);
    this.providerId = null as unknown as number;
    this.show.popularity = 0;
    this.show = new Show();
  }
  onFileSelected(event: any): void {
    const files = event.currentFiles || event.files;
    if (event.files && event.files.length > 0) {
      const file = files[0];
      this.selectedFile = file;
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
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    fileUpload.clear();
  }
  sectorOptions = Object.keys(Sector)
    .filter((key) => isNaN(Number(key)))
    .map((key) => ({
      label: Sector[key as keyof typeof Sector],
      value: Sector[key as keyof typeof Sector], // כאן אנחנו שומרים את הערך ("גברים"), לא את המפתח (MEN)
    }));

  @ViewChild('addProviderRef') addProviderRef!: AddProvider;

  openAddProvider() {
    this.addProviderRef?.showDialog();
  }

  onProviderAdded(provider: Provider) {
    this.providerId = provider.id;
  }
  private loadProviders() {
    this.providerSrv.loadProviders().subscribe({
      next: (providers) => {
        // #region agent log
        console.log('[DEBUG] providers loaded', { count: providers?.length, firstId: providers?.[0]?.id });
        fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bb2b0'},body:JSON.stringify({sessionId:'9bb2b0',location:'add-show.ts:loadProviders.next',message:'providers loaded',data:{count:providers?.length,firstId:providers?.[0]?.id},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        this.providers = providers;
        this.cd.detectChanges(); // פותר את שגיאת ה-NG0100 של המפיקים
      },
      error: (err) => {
        // #region agent log
        console.log('[DEBUG] providers load failed', err?.message || err);
        fetch('http://127.0.0.1:7869/ingest/71f6d3c7-aea8-4b94-a2c3-1c7962199f55',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9bb2b0'},body:JSON.stringify({sessionId:'9bb2b0',location:'add-show.ts:loadProviders.error',message:'providers load failed',data:{err:err?.message||String(err)},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        console.error('Error loading providers', err);
      },
    });
  }
}
