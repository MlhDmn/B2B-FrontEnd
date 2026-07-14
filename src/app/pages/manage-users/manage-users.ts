import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserPermission } from '../../services/auth.service';
import { getApiErrorMessage } from '../../services/api-response';
import { ManagedUser, UserManagementService } from '../../services/user-management.service';

interface UserEditForm {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  permissions: UserPermission[];
  isActive: boolean;
}

interface PermissionOption {
  label: string;
  value: UserPermission;
}

@Component({
  selector: 'app-manage-users',
  imports: [RouterLink],
  templateUrl: './manage-users.html',
  styleUrl: './manage-users.css',
})
export class ManageUsers {
  form = signal<UserEditForm>({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    permissions: [],
    isActive: true
  });

  statusMessage = signal('');
  errorMessage = signal('');
  isLoadingUser = signal(false);
  isSavingUser = signal(false);

  readonly permissionOptions: PermissionOption[] = [
    { label: 'View products', value: UserPermission.ViewProducts },
    { label: 'Add products', value: UserPermission.AddProducts },
    { label: 'Delete products', value: UserPermission.DeleteProducts },
    { label: 'Edit products', value: UserPermission.EditProducts },
    { label: 'Manage categories', value: UserPermission.ManageCategories },
    { label: 'Manage users', value: UserPermission.ManageUsers }
  ];

  constructor(private readonly userManagementService: UserManagementService) {}

  loadUser(): void {
    const userId = String(this.form().userId ?? '').trim();

    if (!this.canLoadUser()) {
      this.errorMessage.set('');
      this.statusMessage.set('Enter a user ID before loading user details.');
      return;
    }

    this.errorMessage.set('');
    this.statusMessage.set('');
    this.isLoadingUser.set(true);

    this.userManagementService.getUserById(userId).subscribe({
      next: user => {
        this.writeUserToForm(userId, user);
        this.statusMessage.set(`Loaded user #${userId}.`);
        this.isLoadingUser.set(false);
      },
      error: error => {
        this.errorMessage.set(getApiErrorMessage(
          error,
          `User #${userId} could not be loaded. Make sure the backend has GET /api/Users/${userId}.`
        ));
        this.isLoadingUser.set(false);
      }
    });
  }

  saveUser(): void {
    const userId = String(this.form().userId ?? '').trim();

    if (!userId) {
      this.errorMessage.set('');
      this.statusMessage.set('Enter a user ID before saving user details.');
      return;
    }

    this.errorMessage.set('');
    this.statusMessage.set('');
    this.isSavingUser.set(true);

    this.userManagementService.updateUser(userId, {
      firstName: this.form().firstName,
      lastName: this.form().lastName,
      email: this.form().email,
      permissions: this.getPermissionMask(),
      isActive: this.form().isActive
    }).subscribe({
      next: user => {
        this.writeUserToForm(userId, user);
        this.statusMessage.set(`Saved changes for user #${userId}.`);
        this.isSavingUser.set(false);
      },
      error: error => {
        this.errorMessage.set(getApiErrorMessage(
          error,
          `User #${userId} could not be updated.`
        ));
        this.isSavingUser.set(false);
      }
    });
  }

  clearStatus(): void {
    this.statusMessage.set('');
    this.errorMessage.set('');
  }

  canLoadUser(): boolean {
    return String(this.form().userId ?? '').trim().length > 0 && !this.isLoadingUser();
  }

  updateField(field: keyof Omit<UserEditForm, 'permissions'>, value: string | boolean): void {
    this.clearStatus();
    this.form.update(form => ({
      ...form,
      [field]: value
    }));
  }

  hasPermission(permission: UserPermission): boolean {
    return this.form().permissions.includes(permission);
  }

  togglePermission(permission: UserPermission, isChecked: boolean): void {
    this.clearStatus();

    if (isChecked) {
      if (!this.hasPermission(permission)) {
        this.form.update(form => ({
          ...form,
          permissions: [...form.permissions, permission]
        }));
      }
      return;
    }

    this.form.update(form => ({
      ...form,
      permissions: form.permissions.filter(item => item !== permission)
    }));
  }

  private writeUserToForm(requestedUserId: string, user: ManagedUser): void {
    this.form.set({
      userId: String(user.userId ?? user.id ?? requestedUserId),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      permissions: this.parsePermissions(Number(user.permissions) || 0),
      isActive: user.isActive ?? true
    });
  }

  private parsePermissions(permissionMask: number): UserPermission[] {
    return this.permissionOptions
      .map(option => option.value)
      .filter(permission => (permissionMask & permission) === permission);
  }

  private getPermissionMask(): number {
    return this.form().permissions.reduce((mask, permission) => mask | permission, 0);
  }
}
