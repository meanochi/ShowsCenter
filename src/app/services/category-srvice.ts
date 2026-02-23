import { Injectable } from '@angular/core';
import { Category } from '../models/category-model';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategorySrvice {
  categories: Category[] = [];

  constructor(private http: HttpClient) {
  }
  /**
   * Build request body for POST /api/Provider.
   * Adjust property names if your API expects different casing.
   */
  private buildAddProviderBody(category: Category): Record<string, unknown> {
    return {
      Name: category.name ?? '',
    };
  }

  loadCategoriers(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/Category').pipe(
      tap((data) => (this.categories = data)),
    );
  }

  /**
   * POST new provider to server, then reload providers list.
   * Returns observable for success/error handling.
   */
  addCategory(category: Category): Observable<Category> {
    const userId = localStorage.getItem('user');
    const body = this.buildAddProviderBody(category);
    return this.http.post<Category>(`/api/Category?userId=${userId}`, body).pipe(
      tap((created) => {
        this.categories = [...this.categories, created];
      }),
      catchError((err) => {
        console.error('addProvider failed', err);
        throw err;
      }),
    );
  }
}
