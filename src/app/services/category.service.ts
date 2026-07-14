import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface CategoryCreateRequest {
  name: string;
  description: string;
}

export type CategoryUpdateRequest = CategoryCreateRequest;

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = 'http://localhost:5072/api/Categories';

  constructor(private readonly http: HttpClient) {}

  getCategories() {
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl).pipe(
      map(response => unwrapApiResponse(response, 'Categories could not be loaded.'))
    );
  }

  createCategory(request: CategoryCreateRequest) {
    return this.http.post<ApiResponse<Category>>(this.apiUrl, request).pipe(
      map(response => unwrapApiResponse(response, 'Category could not be created.'))
    );
  }

  updateCategory(id: number, request: CategoryUpdateRequest) {
    return this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, request).pipe(
      map(response => unwrapApiResponse(response, 'Category could not be updated.'))
    );
  }
}
