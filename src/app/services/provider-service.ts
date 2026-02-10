import { Injectable } from '@angular/core';
import { Provider } from '../models/provider-model';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
    providers: Provider[] = []
    newProvider: Provider = new Provider()
    addProvider(c:string, im:string = '') {
      this.newProvider.id = this.providers.length
      this.newProvider.name = c
      this.newProvider.profileImageUrl = im
      this.providers.push(this.newProvider)
      this.newProvider = new Provider()
    }
    loadProviders(){
      return this.providers
    }
    constructor(){
      this.addProvider("טלי אברהמי", "https://serviced.co.il/wp-content/uploads/2022/01/white-%D7%A6%D7%95%D7%A8-%D7%A7%D7%A9%D7%A8-%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%9C%D7%A7%D7%95%D7%97%D7%95%D7%AA-%D7%98%D7%9C%D7%99-%D7%90%D7%91%D7%A8%D7%94%D7%9E%D7%99.jpg")
      this.addProvider("שלום וגשל", "https://vagshal-mp.com/wp-content/uploads/2024/08/Logo_2022-02-300x169.png")
      this.addProvider("בתיה", "https://www.kol-graph.co.il/images/site/home/clientlogo/clientlogo16.png")
    }
}
