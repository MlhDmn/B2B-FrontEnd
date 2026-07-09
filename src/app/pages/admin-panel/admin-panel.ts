import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService, UserPermission } from '../../services/auth.service';

interface AdminAction {
  title: string;
  description: string;
  route: string;
  permission: UserPermission;
}

@Component({
  selector: 'app-admin-panel',
  imports: [RouterLink],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.css',
})
export class AdminPanel {
  private readonly actions: AdminAction[] = [
    {
      title: 'Products',
      description: 'View the catalog and product inventory.',
      route: '/home',
      permission: UserPermission.ViewProducts
    },
    {
      title: 'Add Product',
      description: 'Create a new catalog item.',
      route: '/products/add',
      permission: UserPermission.AddProducts
    },
    {
      title: 'Edit Products',
      description: 'Update existing product records.',
      route: '/admin/products/edit',
      permission: UserPermission.EditProducts
    },
    {
      title: 'Delete Products',
      description: 'Remove product records from the catalog.',
      route: '/admin/products/delete',
      permission: UserPermission.DeleteProducts
    },
    {
      title: 'Manage Categories',
      description: 'Organize product categories.',
      route: '/admin/categories',
      permission: UserPermission.ManageCategories
    },
    {
      title: 'Manage Users',
      description: 'Manage user access and permissions.',
      route: '/admin/users',
      permission: UserPermission.ManageUsers
    }
  ];

  allowedActions = computed(() => {
    return this.actions.filter(action => this.authService.hasPermission(action.permission));
  });

  constructor(private readonly authService: AuthService) {}
}
