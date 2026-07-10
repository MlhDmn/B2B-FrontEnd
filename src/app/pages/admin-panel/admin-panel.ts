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
      title: 'Add Product',
      description: 'Create a new catalog item.',
      route: '/products/add',
      permission: UserPermission.AddProducts
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
