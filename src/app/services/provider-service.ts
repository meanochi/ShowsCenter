import { Injectable } from '@angular/core';
import { Provider } from '../models/provider-model';
import { HttpClient } from '@angular/common/http';

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
    loadProviders() {
      this.http.get<Provider[]>('/api/Provider').subscribe(data => {
          this.providers = data;
    });
    }
    constructor( private http: HttpClient){
    }
}
