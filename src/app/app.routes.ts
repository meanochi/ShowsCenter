import { Routes } from '@angular/router';
import { ShowsComponent } from './components/products/show';
import { Login } from './components/users/login/login';
import { Signup } from './components/users/signup/signup';
import { AboutComponent } from './components/about/about';
import { CartComponent } from './components/cart/cart';
import { PersonalAreaComponent } from './components/personal-area/personal-area';

export const routes: Routes = [
  { path: '', redirectTo: '/shows', pathMatch: 'full' },
  { path: 'shows', component: ShowsComponent },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'about', component: AboutComponent },
  { path: 'cart', component: CartComponent },
  { path: 'personal-area', component: PersonalAreaComponent },
  { path: '**', redirectTo: '/shows' },
];
