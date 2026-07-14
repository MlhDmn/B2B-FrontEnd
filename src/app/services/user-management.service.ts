import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface ManagedUser {
  id?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  permissions: number | string;
  isActive?: boolean;
}

export interface ManagedUserUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  permissions: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly apiUrl = 'http://localhost:5072/api/Users';

  constructor(private readonly http: HttpClient) {}

  getUserById(userId: string) {
    return this.http.get<ApiResponse<ManagedUser> | ManagedUser>(`${this.apiUrl}/${userId}`).pipe(
      map(response => {
        if (isApiResponse(response)) {
          return unwrapApiResponse(response, 'User could not be loaded.');
        }

        return response;
      })
    );
  }

  updateUser(userId: string, request: ManagedUserUpdateRequest) {
    return this.http.put<ApiResponse<ManagedUser> | ManagedUser>(`${this.apiUrl}/${userId}`, request).pipe(
      map(response => {
        if (isApiResponse(response)) {
          return unwrapApiResponse(response, 'User could not be updated.');
        }

        return response;
      })
    );
  }
}

function isApiResponse(value: ApiResponse<ManagedUser> | ManagedUser): value is ApiResponse<ManagedUser> {
  return 'hasError' in value && 'data' in value;
}
