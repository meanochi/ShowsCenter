import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { forkJoin } from 'rxjs';
import { User } from '../../models/user-model';
import { UsersService } from '../../services/users-service';
import { AuthService } from '../../services/auth-service';
import { Inject, PLATFORM_ID } from '@angular/core';
import { CategorySrvice } from '../../services/category-srvice';
import { ProviderService } from '../../services/provider-service';
import { Category } from '../../models/category-model';
import { Provider } from '../../models/provider-model';
import { AddCategory } from '../categories/add-category/add-category';
import { AddProvider } from '../providers/add-provider/add-provider';

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
    AddCategory,
    AddProvider,
  ],
  templateUrl: './personal-area.html',
  styleUrls: ['./personal-area.scss'],
})
export class PersonalAreaComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  private usersSrv = inject(UsersService);
  private authSrv = inject(AuthService);
  private categorySrv = inject(CategorySrvice);
  private providerSrv = inject(ProviderService);

  user = signal<User | null>(null);
  loadError = signal<string | null>(null);
  saveMessage = signal<'success' | 'error' | null>(null);
  saving = signal(false);
  isAdmin = signal(false);
  adminDataLoading = signal(false);
  adminDataError = signal<string | null>(null);
  managementMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  categories = signal<Category[]>([]);
  providers = signal<Provider[]>([]);

  /** Form model for editing (copy so we don't mutate loaded user until save). */
  editUser: User = new User();
  /** Optional new password; only sent when user types something. */
  newPassword = '';
  categoryDraftById: Record<number, string> = {};
  providerDraftById: Record<number, string> = {};

  @ViewChild('addCategoryRef') addCategoryRef!: AddCategory;
  @ViewChild('addProviderRef') addProviderRef!: AddProvider;

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
        next: (u) => {
          this.user.set(u);
          this.editUser = this.trimUser({ ...u, password: '' });
          this.loadAdminManagementIfNeeded(userId);
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

  private loadAdminManagementIfNeeded(userId: number): void {
    this.authSrv.checkIsManager(userId).subscribe({
      next: (isManager) => {
        this.isAdmin.set(isManager);
        if (isManager) {
          this.loadAdminManagementData();
        }
      },
      error: () => {
        this.isAdmin.set(false);
      },
    });
  }

  private loadAdminManagementData(): void {
    this.adminDataLoading.set(true);
    this.adminDataError.set(null);
    this.managementMessage.set(null);
    forkJoin({
      categories: this.categorySrv.loadCategories(),
      providers: this.providerSrv.loadProviders(),
    }).subscribe({
      next: ({ categories, providers }) => {
        this.categories.set(categories);
        this.providers.set(providers);
        this.syncCategoryDrafts(categories);
        this.syncProviderDrafts(providers);
        this.adminDataLoading.set(false);
      },
      error: () => {
        this.adminDataError.set('לא ניתן לטעון נתוני ניהול כרגע.');
        this.adminDataLoading.set(false);
      },
    });
  }

  private syncCategoryDrafts(categories: Category[]): void {
    const nextDrafts: Record<number, string> = {};
    categories.forEach((category) => {
      nextDrafts[category.id] = category.name ?? '';
    });
    this.categoryDraftById = nextDrafts;
  }

  private syncProviderDrafts(providers: Provider[]): void {
    const nextDrafts: Record<number, string> = {};
    providers.forEach((provider) => {
      nextDrafts[provider.id] = provider.name ?? '';
    });
    this.providerDraftById = nextDrafts;
  }

  openAddCategoryDialog(): void {
    this.addCategoryRef?.showDialog();
  }

  openAddProviderDialog(): void {
    this.addProviderRef?.showDialog();
  }

  onCategoryAdded(_created: Category): void {
    this.refreshCategories();
    this.managementMessage.set({ type: 'success', text: 'הקטגוריה נוספה בהצלחה.' });
  }

  onProviderAdded(_created: Provider): void {
    this.refreshProviders();
    this.managementMessage.set({ type: 'success', text: 'המפיק נוסף בהצלחה.' });
  }

  saveCategory(category: Category): void {
    const updatedName = (this.categoryDraftById[category.id] ?? '').trim();
    if (!updatedName) {
      this.managementMessage.set({ type: 'error', text: 'שם קטגוריה לא יכול להיות ריק.' });
      return;
    }
    if (updatedName === (category.name ?? '').trim()) return;

    this.managementMessage.set(null);
    this.categorySrv.updateCategory({ ...category, name: updatedName }).subscribe({
      next: (updated) => {
        this.categories.update((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
        this.categoryDraftById[updated.id] = updated.name ?? '';
        this.managementMessage.set({ type: 'success', text: 'הקטגוריה עודכנה בהצלחה.' });
      },
      error: () => {
        this.managementMessage.set({ type: 'error', text: 'עדכון הקטגוריה נכשל.' });
      },
    });
  }

  deleteCategory(category: Category): void {
    if (!confirm(`למחוק את הקטגוריה "${category.name}"?`)) return;

    this.managementMessage.set(null);
    this.categorySrv.deleteCategory(category.id).subscribe({
      next: () => {
        this.categories.update((current) => current.filter((item) => item.id !== category.id));
        delete this.categoryDraftById[category.id];
        this.managementMessage.set({ type: 'success', text: 'הקטגוריה נמחקה.' });
      },
      error: () => {
        this.managementMessage.set({
          type: 'error',
          text: 'מחיקת הקטגוריה נכשלה. ייתכן שהיא בשימוש במופעים קיימים.',
        });
      },
    });
  }

  saveProvider(provider: Provider): void {
    const updatedName = (this.providerDraftById[provider.id] ?? '').trim();
    if (!updatedName) {
      this.managementMessage.set({ type: 'error', text: 'שם מפיק לא יכול להיות ריק.' });
      return;
    }
    if (updatedName === (provider.name ?? '').trim()) return;

    this.managementMessage.set(null);
    const payload: Provider = {
      ...provider,
      name: updatedName,
      profileimgUrl: (provider as Provider & { profileImgUrl?: string }).profileimgUrl
        ?? (provider as Provider & { profileImgUrl?: string }).profileImgUrl
        ?? '',
    };
    this.providerSrv.updateProvider(payload).subscribe({
      next: (updated) => {
        this.providers.update((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        );
        this.providerDraftById[updated.id] = updated.name ?? '';
        this.managementMessage.set({ type: 'success', text: 'פרטי המפיק עודכנו.' });
      },
      error: () => {
        this.managementMessage.set({ type: 'error', text: 'עדכון המפיק נכשל.' });
      },
    });
  }

  deleteProvider(provider: Provider): void {
    if (!confirm(`למחוק את המפיק "${provider.name}"?`)) return;

    this.managementMessage.set(null);
    this.providerSrv.deleteProvider(provider.id).subscribe({
      next: () => {
        this.providers.update((current) => current.filter((item) => item.id !== provider.id));
        delete this.providerDraftById[provider.id];
        this.managementMessage.set({ type: 'success', text: 'המפיק נמחק.' });
      },
      error: () => {
        this.managementMessage.set({
          type: 'error',
          text: 'מחיקת המפיק נכשלה. ייתכן שהוא בשימוש במופעים קיימים.',
        });
      },
    });
  }

  getProviderImage(provider: Provider): string {
    const p = provider as Provider & { profileImgUrl?: string };
    const path = p.profileimgUrl ?? p.profileImgUrl ?? '';
    return path ? `https://localhost:44304/${path}` : 'timeBank.png';
  }

  private refreshCategories(): void {
    this.categorySrv.loadCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.syncCategoryDrafts(categories);
      },
      error: () => {
        this.managementMessage.set({ type: 'error', text: 'טעינת הקטגוריות נכשלה.' });
      },
    });
  }

  private refreshProviders(): void {
    this.providerSrv.loadProviders().subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.syncProviderDrafts(providers);
      },
      error: () => {
        this.managementMessage.set({ type: 'error', text: 'טעינת המפיקים נכשלה.' });
      },
    });
  }
}
