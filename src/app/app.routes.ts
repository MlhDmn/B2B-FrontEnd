import { Routes } from '@angular/router';
import { Login } from './pages/login/login'; 
import { Signup } from './pages/signup/signup';
import { Landing } from './pages/landing/landing';
import { AddProduct } from './pages/add-product/add-product';
import { EditProducts } from './pages/edit-products/edit-products';
import { authGuard } from './core/auth.guard';
import { Unauthorized } from './pages/unauthorized/unauthorized';
import { AdminPanel } from './pages/admin-panel/admin-panel';
import { AdminFeature } from './pages/admin-feature/admin-feature';
import { ShoppingCart } from './pages/shopping-cart/shopping-cart';
import { ManageCategories } from './pages/manage-categories/manage-categories';
import { ManageUsers } from './pages/manage-users/manage-users';
import { permissionGuard } from './core/permission.guard';
import { UserPermission } from './services/auth.service';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'unauthorized', component: Unauthorized },
  { path: 'home', component: Landing, canActivate: [authGuard] },
  { path: 'cart', component: ShoppingCart, canActivate: [authGuard] },
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
    component: EditProducts,
    canActivate: [authGuard, permissionGuard],
    data: { permission: UserPermission.EditProducts }
  },
  {
    path: 'admin/categories',
    component: ManageCategories,
    canActivate: [authGuard, permissionGuard],
    data: { permission: UserPermission.ManageCategories }
  },
  {
    path: 'admin/users',
    component: ManageUsers,
    canActivate: [authGuard, permissionGuard],
    data: { permission: UserPermission.ManageUsers }
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
