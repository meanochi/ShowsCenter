import { Injectable } from '@angular/core';
import { Provider } from '../models/provider-model';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
    providers: Provider[] = []
    newProvider: Provider = new Provider()
    addProvider(c:string, im:string = '') {
      this.newProvider.id = this.providers.length
      this.newProvider.name = c
      this.newProvider.profileimgUrl = im
      this.providers.push(this.newProvider)
      this.newProvider = new Provider()
    }
    
    loadProviders(): Observable<Provider[]> {
      return this.http.get<Provider[]>('/api/Provider').pipe(
          tap(data => this.providers = data) 
      );
    }
    constructor( private http: HttpClient){
    }
}
