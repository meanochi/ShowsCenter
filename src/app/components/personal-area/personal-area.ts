import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { forkJoin, map, of, catchError } from 'rxjs';
import { User } from '../../models/user-model';
import { UsersService } from '../../services/users-service';
import { AuthService } from '../../services/auth-service';
import { Inject, PLATFORM_ID } from '@angular/core';
import { ShowsService } from '../../services/shows-service';

interface PersonalOrderItem {
  id: number;
  showId: number;
  sectionId: number;
  row: number;
  col: number;
  status: number;
  price: number;
}

interface PersonalOrder {
  id: number;
  date: Date | null;
  status: number;
  totalPrice: number;
  items: PersonalOrderItem[];
}

@Component({
  selector: 'app-personal-area',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    FloatLabel,
    PasswordModule,
  ],
  templateUrl: './personal-area.html',
  styleUrls: ['./personal-area.scss'],
})
export class PersonalAreaComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  private usersSrv = inject(UsersService);
  private authSrv = inject(AuthService);
  private showsSrv = inject(ShowsService);

  user = signal<User | null>(null);
  loadError = signal<string | null>(null);
  loadingOrders = signal(false);
  orders = signal<PersonalOrder[]>([]);
  selectedOrder = signal<PersonalOrder | null>(null);
  saveMessage = signal<'success' | 'error' | null>(null);
  saving = signal(false);
  showTitleMap = signal<Record<number, string>>({});

  /** Form model for editing (copy so we don't mutate loaded user until save). */
  editUser: User = new User();
  /** Optional new password; only sent when user types something. */
  newPassword = '';

  orderCount = computed(() => this.orders().length);
  orderedItemsCount = computed(() => this.orders().reduce((acc, order) => acc + order.items.length, 0));
  totalSpent = computed(() => this.orders().reduce((acc, order) => acc + order.totalPrice, 0));
  userFullName = computed(() => {
    const u = this.user();
    if (!u) return '';
    return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  });

  private trimUser(u: User): User {
    return {
      ...u,
      firstName: (u.firstName ?? '').trim(),
      lastName: (u.lastName ?? '').trim(),
      emailAddress: (u.emailAddress ?? '').trim(),
      phoneNumber: (u.phoneNumber ?? '').trim(),
      password: u.password ?? '',
    };
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userId = Number(localStorage.getItem('user'));
      if (!userId) {
        this.loadError.set('יש להתחבר כדי לראות את האזור האישי');
        return;
      }
      this.usersSrv.getUserById(userId).subscribe({
        next: (u: any) => {
          this.user.set(u);
          this.editUser = this.trimUser({ ...u, password: '' });
          this.loadingOrders.set(true);
          const orders = this.normalizeOrdersFromUser(u);
          this.orders.set(orders);
          this.loadingOrders.set(false);
          this.loadShowTitles(orders);
        },
        error: () => this.loadError.set('לא ניתן לטעון פרטי משתמש'),
      });
    }
  }

  save(): void {
    const u = this.user();
    if (!u?.id) return;
    this.saving.set(true);
    this.saveMessage.set(null);
    const toSend = this.trimUser({ ...this.editUser, id: u.id });
    if (this.newPassword.trim()) toSend.password = this.newPassword.trim();
    this.usersSrv.updateUser(u.id, toSend).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.editUser = this.trimUser({ ...updated, password: '' });
        this.newPassword = '';
        this.authSrv.login(String(updated.id), updated.firstName);
        this.saveMessage.set('success');
        this.saving.set(false);
      },
      error: () => {
        this.saveMessage.set('error');
        this.saving.set(false);
      },
    });
  }

  openOrderDetails(order: PersonalOrder): void {
    this.selectedOrder.set(order);
  }

  closeOrderDetails(): void {
    this.selectedOrder.set(null);
  }

  getShowTitle(showId: number): string {
    if (showId <= 0) return 'מופע';
    return this.showTitleMap()[showId] ?? `מופע #${showId}`;
  }

  orderStatusLabel(status: number): string {
    if (status === 2) return 'הושלמה';
    if (status === 1) return 'בהמתנה';
    if (status === 0) return 'טיוטה';
    return 'לא ידוע';
  }

  private loadShowTitles(orders: PersonalOrder[]): void {
    const uniqueShowIds = [...new Set(orders.flatMap((order) => order.items.map((item) => item.showId)))].filter(
      (id) => id > 0
    );
    if (uniqueShowIds.length === 0) return;

    const requests = uniqueShowIds.map((id) =>
      this.showsSrv.getShowById(id).pipe(
        map((show) => ({ id, title: show?.title?.trim() || `מופע #${id}` })),
        catchError(() => of({ id, title: `מופע #${id}` }))
      )
    );

    forkJoin(requests).subscribe((results) => {
      const nextMap = { ...this.showTitleMap() };
      for (const result of results) {
        nextMap[result.id] = result.title;
      }
      this.showTitleMap.set(nextMap);
    });
  }

  private normalizeOrdersFromUser(user: any): PersonalOrder[] {
    const rawOrders = this.toArray(user?.orders ?? user?.Orders);

    return rawOrders
      .map((rawOrder: any, index: number): PersonalOrder => {
        const rawItems = this.toArray(rawOrder?.orderedSeats ?? rawOrder?.OrderedSeats ?? rawOrder?.seats);
        const items = rawItems
          .map((rawItem: any) => this.normalizeOrderItem(rawItem))
          .filter((item): item is PersonalOrderItem => item != null);

        const amountFromServer = this.toNumber(
          rawOrder?.price ?? rawOrder?.Price ?? rawOrder?.totalPrice ?? rawOrder?.TotalPrice
        );
        const totalPrice = amountFromServer > 0 ? amountFromServer : items.reduce((sum, item) => sum + item.price, 0);

        return {
          id: this.toNumber(rawOrder?.id ?? rawOrder?.Id) || index + 1,
          date: this.toDate(rawOrder?.date ?? rawOrder?.Date ?? rawOrder?.createdAt ?? rawOrder?.CreatedAt),
          status: this.toNumber(rawOrder?.status ?? rawOrder?.Status),
          totalPrice,
          items,
        };
      })
      .filter((order) => order.items.length > 0)
      .sort((a, b) => {
        const aTime = a.date ? a.date.getTime() : 0;
        const bTime = b.date ? b.date.getTime() : 0;
        return bTime - aTime;
      });
  }

  private normalizeOrderItem(rawItem: any): PersonalOrderItem | null {
    if (rawItem == null || typeof rawItem !== 'object') return null;
    const showId = this.toNumber(rawItem?.showId ?? rawItem?.ShowId);
    const row = this.toNumber(rawItem?.row ?? rawItem?.Row);
    const col = this.toNumber(rawItem?.col ?? rawItem?.Col);
    if (showId <= 0 || row < 0 || col < 0) return null;

    return {
      id: this.toNumber(rawItem?.id ?? rawItem?.Id ?? rawItem?.orderedSeatId ?? rawItem?.OrderedSeatId),
      showId,
      sectionId: this.toNumber(rawItem?.sectionId ?? rawItem?.SectionId ?? rawItem?.sectionSectionType),
      row,
      col,
      status: this.toNumber(rawItem?.status ?? rawItem?.Status),
      price: this.toNumber(rawItem?.price ?? rawItem?.Price),
    };
  }

  private toNumber(v: unknown): number {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private toDate(v: unknown): Date | null {
    if (!v) return null;
    const d = new Date(String(v));
    return isNaN(d.getTime()) ? null : d;
  }

  private toArray(v: unknown): any[] {
    return Array.isArray(v) ? v : [];
  }
}
