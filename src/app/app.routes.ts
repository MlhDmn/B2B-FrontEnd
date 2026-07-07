import { Routes } from '@angular/router';
import { Login } from './pages/login/login'; 
import { Signup } from './pages/signup/signup';
import { Landing } from './pages/landing/landing';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'home', component: Landing },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
// AUTH GUARD buraya eklenecek