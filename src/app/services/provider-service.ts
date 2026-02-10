import { Injectable } from '@angular/core';
import { Provider } from '../models/provider-model';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
    providers: Provider[] = []
    newProvider: Provider = new Provider()
    addProvider(c:string, im:string = '') {
      this.newProvider.id = this.providers.length+1
      this.newProvider.name = c
      this.newProvider.profileImageUrl = im
      this.providers.push(this.newProvider)
      this.newProvider = new Provider()
    }
}
