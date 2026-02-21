import { Injectable } from '@angular/core';
import { Provider } from '../models/provider-model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  providers: Provider[] = [];

  constructor(private http: HttpClient) {}

  /**
   * Build request body for POST /api/Provider.
   * Adjust property names if your API expects different casing.
   */
  private buildAddProviderBody(provider: Provider): Record<string, unknown> {
    return {
      Name: provider.name ?? '',
      ProfileimgUrl: provider.profileimgUrl ?? '',
    };
  }

  loadProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>('/api/Provider').pipe(
      tap((data) => (this.providers = data)),
    );
  }

  /**
   * POST new provider to server, then reload providers list.
   * Returns observable for success/error handling.
   */
  addProvider(provider: Provider): Observable<Provider> {
    const userId = localStorage.getItem('user');
    const body = this.buildAddProviderBody(provider);
    return this.http.post<Provider>(`/api/Provider?userId=${userId}`, body).pipe(
      tap((created) => {
        this.providers = [...this.providers, created];
      }),
      catchError((err) => {
        console.error('addProvider failed', err);
        throw err;
      }),
    );
  }
}
