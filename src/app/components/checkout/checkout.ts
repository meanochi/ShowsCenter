import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../services/cart-service';
import { ShowsService } from '../../services/shows-service';
import { UsersService } from '../../services/users-service';
import { AuthService } from '../../services/auth-service';
import { Seat } from '../../models/seat-model';
import { Show } from '../../models/show-model';
import { User } from '../../models/user-model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

const STEPS = {
  ORDER_SUMMARY: 1,
  USER_DETAILS: 2,
  PAYMENT: 3,
  CONFIRMATION: 4,
} as const;

/** Snapshot of one item for the order confirmation view. */
export interface ConfirmationItem {
  showTitle: string;
  section: string;
  row: number;
  col: number;
  showDate: Date | string;
  showTime: string;
  price: number;
}

/** Luhn check and basic card validation. */
function luhnCheck(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (isEven) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

function expiryValidator(control: { value: string }) {
  const v = (control.value || '').trim();
  if (!v) return null;
  const [mm, yy] = v.split(/[/-]/).map((s) => s.trim());
  const month = parseInt(mm, 10);
  const year = parseInt(yy?.length === 2 ? '20' + yy : yy, 10);
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return { invalidExpiry: true };
  }
  const now = new Date();
  const exp = new Date(year, month, 0);
  return exp >= now ? null : { expired: true };
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    FloatLabelModule,
    DatePipe,
  ],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.scss'],
})
export class CheckoutComponent implements OnInit {
  private cartSrv = inject(CartService);
  private showSrv = inject(ShowsService);
  private usersSrv = inject(UsersService);
  private authSrv = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  readonly STEPS = STEPS;
  currentStep = signal<number>(STEPS.ORDER_SUMMARY);
  cartItems: Seat[] = [];
  user = signal<User | null>(null);
  userLoadError = signal<string | null>(null);
  orderConfirmationCode = signal<string>('');
  /** Set after successful placeOrder: order creation date from server. */
  orderCreatedAt = signal<Date | null>(null);
  /** Snapshot of ordered items for confirmation (row, col, show date/time, etc.). */
  confirmationItems = signal<ConfirmationItem[]>([]);
  totalPaid = signal<number>(0);
  placingOrder = signal<boolean>(false);
  placeOrderError = signal<string | null>(null);
  paymentForm: FormGroup;

  steps = [
    { index: 1, label: 'סיכום הזמנה' },
    { index: 2, label: 'פרטי משתמש' },
    { index: 3, label: 'תשלום' },
    { index: 4, label: 'אישור' },
  ];

  totalToPay(): number {
    return this.cartItems.reduce((sum, s) => sum + this.getSeatPrice(s), 0);
  }

  constructor() {
    this.paymentForm = this.fb.group({
      cardNumber: [
        '',
        [
          Validators.required,
          (control: AbstractControl) => {
            const raw = (control.value || '').replace(/\s/g, '');
            if (raw.length < 13 || raw.length > 19) return { pattern: true };
            return luhnCheck(raw) ? null : { luhn: true };
          },
        ],
      ],
      expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/), expiryValidator]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    });
  }

  ngOnInit(): void {
    if (!this.cartSrv.isLoggedIn) {
      this.router.navigate(['/cart']);
      return;
    }
    this.cartSrv.cart$.subscribe((items) => {
      this.cartItems = items;
    });
    const userId = this.cartSrv.getCurrentUserId();
    if (userId > 0) {
      this.usersSrv.getUserById(userId).subscribe({
        next: (u) => this.user.set(u),
        error: () => this.userLoadError.set('לא ניתן לטעון פרטי משתמש'),
      });
    }
  }

  getShow(showId: number | undefined): Show | undefined {
    if (showId == null) return undefined;
    return this.showSrv.findShow(showId);
  }

  getSeatPrice(seat: Seat): number {
    if (seat.price != null && seat.price > 0) return seat.price;
    const show = this.getShow(seat.showId);
    return this.showSrv.getSectionPrice(show ?? null, seat.section);
  }

  get currentStepValue(): number {
    return this.currentStep();
  }

  goNext(): void {
    const step = this.currentStep();
    if (step === STEPS.PAYMENT && !this.paymentForm.valid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    if (step === STEPS.PAYMENT && step + 1 === STEPS.CONFIRMATION) {
      this.placeOrder();
      return;
    }
    if (step < STEPS.CONFIRMATION) {
      this.currentStep.set(step + 1);
    }
  }

  goPrev(): void {
    const step = this.currentStep();
    if (step > STEPS.ORDER_SUMMARY) {
      this.currentStep.set(step - 1);
    }
  }

  /** Confirm payment: POST order to server, then clear cart and show confirmation. */
  placeOrder(): void {
    const items = this.cartItems;
    const orderItemIds = items.map((s) => s.id).filter((id): id is number => id != null);
    if (orderItemIds.length === 0) {
      this.placeOrderError.set('אין פריטים לאישור');
      return;
    }
    this.placingOrder.set(true);
    this.placeOrderError.set(null);
    const total = this.totalToPay();

    this.cartSrv.confirmOrder(orderItemIds).subscribe({
      next: (res) => {
        this.placingOrder.set(false);
        const code = res.confirmationCode ?? 'TB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        this.orderConfirmationCode.set(code);
        this.orderCreatedAt.set(res.date ? new Date(res.date) : new Date());
        this.totalPaid.set(total);
        this.confirmationItems.set(this.buildConfirmationItems(items));
        this.cartSrv.clearCart();
        this.cartItems = [];
        this.currentStep.set(STEPS.CONFIRMATION);
      },
      error: (err) => {
        this.placingOrder.set(false);
        const msg = err?.error?.message ?? err?.message ?? 'אישור ההזמנה נכשל. נסה שוב.';
        this.placeOrderError.set(msg);
      },
    });
  }

  private buildConfirmationItems(seats: Seat[]): ConfirmationItem[] {
    return seats.map((seat) => {
      const show = this.getShow(seat.showId);
      const price = this.getSeatPrice(seat);
      const date = show?.date;
      const beginTime = show?.beginTime;
      let showTime = '';
      if (beginTime != null) {
        const t = typeof beginTime === 'string' ? beginTime : (beginTime instanceof Date ? beginTime.toTimeString() : '');
        showTime = String(t).substring(0, 5);
      }
      return {
        showTitle: show?.title ?? 'מופע',
        section: typeof seat.section === 'string' ? seat.section : String(seat.section),
        row: seat.row + 1,
        col: seat.col + 1,
        showDate: date ?? '',
        showTime,
        price,
      };
    });
  }

  isStepActive(stepIndex: number): boolean {
    return this.currentStep() === stepIndex;
  }

  isStepCompleted(stepIndex: number): boolean {
    return this.currentStep() > stepIndex;
  }

  goToEditProfile(): void {
    this.router.navigate(['/personal-area']);
  }

  formatCardNumber(value: string): string {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(\d{4})/g, '$1 ').trim();
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatCardNumber(input.value);
    this.paymentForm.patchValue({ cardNumber: formatted.replace(/\s/g, '') }, { emitEvent: false });
    input.value = formatted;
  }

  seatKey(seat: Seat): string {
    return `${seat.section}-${seat.row}-${seat.col}-${seat.id ?? ''}`;
  }

  get userName(): string {
    return this.authSrv.userName() || this.user()?.firstName + ' ' + (this.user()?.lastName ?? '') || 'משתמש';
  }
}
