import { Routes } from '@angular/router';
import { Login } from './pages/login/login'; 
import { Signup } from './pages/signup/signup';
import { Landing } from './pages/landing/landing';
import { AddProduct } from './pages/add-product/add-product';
import { authGuard } from './core/auth.guard';
import { Unauthorized } from './pages/unauthorized/unauthorized';
import { AdminPanel } from './pages/admin-panel/admin-panel';
import { AdminFeature } from './pages/admin-feature/admin-feature';
import { permissionGuard } from './core/permission.guard';
import { UserPermission } from './services/auth.service';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'unauthorized', component: Unauthorized },
  { path: 'home', component: Landing, canActivate: [authGuard] },
  {
    path: 'admin',
    component: AdminPanel,
    canActivate: [authGuard, permissionGuard],
    data: { requiresAdminPanelAccess: true }
  },
  {
    path: 'products/add',
    component: AddProduct,
    canActivate: [authGuard, permissionGuard],
    data: { permission: UserPermission.AddProducts }
  },
  {
    path: 'admin/products/edit',
    component: AdminFeature,
    canActivate: [authGuard, permissionGuard],
    data: {
      permission: UserPermission.EditProducts,
      eyebrow: 'Product tools',
      title: 'Edit Products',
      description: 'Update existing product information from this workspace.'
    }
  },
  {
    path: 'admin/products/delete',
    component: AdminFeature,
    canActivate: [authGuard, permissionGuard],
    data: {
      permission: UserPermission.DeleteProducts,
      eyebrow: 'Product tools',
      title: 'Delete Products',
      description: 'Remove catalog items when your account has delete access.'
    }
  },
  {
    path: 'admin/categories',
    component: AdminFeature,
    canActivate: [authGuard, permissionGuard],
    data: {
      permission: UserPermission.ManageCategories,
      eyebrow: 'Catalog tools',
      title: 'Manage Categories',
      description: 'Create, edit, and organize catalog categories.'
    }
  },
  {
    path: 'admin/users',
    component: AdminFeature,
    canActivate: [authGuard, permissionGuard],
    data: {
      permission: UserPermission.ManageUsers,
      eyebrow: 'Access tools',
      title: 'Manage Users',
      description: 'Review users and adjust account permissions.'
    }
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
