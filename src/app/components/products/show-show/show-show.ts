import { Component, Output, EventEmitter, Input, inject, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ShowsService } from '../../../services/shows-service';
import { Sector, Show, TargetAudience } from '../../../models/show-model';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DatePipe } from '@angular/common';
import { ProviderService } from '../../../services/provider-service';
import { CarouselModule } from 'primeng/carousel';
import { CategorySrvice } from '../../../services/category-srvice';
import { ProgressSpinnerModule } from 'primeng/progressspinner'; //
import { TooltipModule } from 'primeng/tooltip';
import { Provider } from '../../../models/provider-model';
import { Observable } from 'rxjs';
import { ImageService } from '../../../services/image-service';
import { Category } from '../../../models/category-model';
@Component({
  selector: 'app-show-show',
  imports: [
    AvatarModule,
    ButtonModule,
    DatePipe,
    CarouselModule,
    AvatarModule,
    ProgressSpinnerModule,
    TooltipModule,
  ],
  templateUrl: './show-show.html',
  styleUrl: './show-show.scss',
})
export class ShowShow implements OnChanges, OnDestroy {
  showSrv: ShowsService = inject(ShowsService);
  private cd = inject(ChangeDetectorRef);
  categoreySrv: CategorySrvice = inject(CategorySrvice);
  providerSrv: ProviderService = inject(ProviderService);
  providers: Provider[] = [];
  providers$: Observable<Provider[]> | undefined;
  categories :Category[]=[];
  readonly Audience = TargetAudience;
  readonly Sector = Sector;
  currProvider: Provider | undefined;
  imageSrv: ImageService = inject(ImageService);
  @Input()
  showId: number = 0;

  @Output()
  openSeatsMap = new EventEmitter<number>();

  @Output()
  openShowDetails = new EventEmitter<number>();

  showProd: Show = new Show();
  userName: string = 'Michal';
  responsiveOptions: any[] | undefined;
  relatedEvents: Show[] = [];
  /** Live countdown until show start (e.g. "05:12:06:30" = 5 days 12h 6m 30s). */
  countdownLabel: string = '';
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  ngOnInit() {
    this.loadProviders();
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
    this.categoreySrv.categories$.subscribe(data => {
      this.categories = data;
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['showId']) {
      this.showProd = this.showSrv.findShow(this.showId)
        ? this.showSrv.findShow(this.showId)!
        : new Show();
      this.relatedEvents = this.showSrv.shows.filter(
        (element) =>
          element.categoryId === this.showProd.categoryId && element.id !== this.showProd.id,
      );
      this.startCountdown();
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  /** Build show start Date from date + beginTime (string "HH:mm" or Date). */
  getShowStartDate(show: Show): Date | null {
    if (!show?.date) return null;
    const d = new Date(show.date);
    const bt = show.beginTime;
    if (typeof bt === 'string' && bt) {
      const parts = bt.trim().split(':');
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      d.setHours(h, m, 0, 0);
    } else if (bt instanceof Date) {
      d.setHours(bt.getHours(), bt.getMinutes(), 0, 0);
    }
    return d;
  }

  private stopCountdown(): void {
    if (this.countdownTimer != null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.updateCountdown();
    this.countdownTimer = setInterval(() => this.updateCountdown(), 1000);
  }

  /** Set countdownLabel to "DD:HH:MM:SS" (days : hours : minutes : seconds) until show start. */
  updateCountdown(): void {
    const start = this.getShowStartDate(this.showProd);
    if (!start) {
      this.countdownLabel = '--:--:--:--';
      this.cd.detectChanges();
      return;
    }
    const now = Date.now();
    const ms = start.getTime() - now;
    if (ms <= 0) {
      this.countdownLabel = 'המופע כבר התקיים';
      this.cd.detectChanges();
      return;
    }
    const sec = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / (1000 * 60)) % 60;
    const hrs = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    this.countdownLabel = [
      days.toString().padStart(2, '0'),
      hrs.toString().padStart(2, '0'),
      min.toString().padStart(2, '0'),
      sec.toString().padStart(2, '0'),
    ].join(':');
    this.cd.detectChanges();
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
    return this.providers.find((p) => p.id === this.showProd.providerId);
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
