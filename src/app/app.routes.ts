import { Routes } from '@angular/router';
import { Login } from './pages/login/login'; 
import { Signup } from './pages/signup/signup';
import { Landing } from './pages/landing/landing';
import { AddProduct } from './pages/add-product/add-product';
import { authGuard } from './core/auth.guard';
import { Unauthorized } from './pages/unauthorized/unauthorized';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'unauthorized', component: Unauthorized },
  { path: 'home', component: Landing, canActivate: [authGuard] },
  { path: 'products/add', component: AddProduct, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
