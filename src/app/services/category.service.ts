import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export interface Category {
  id: number;
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = 'http://localhost:5072/api/Categories';

  constructor(private readonly http: HttpClient) {}

  getCategories() {
    return this.http.get<ApiResponse<Category[]>>(this.apiUrl).pipe(
      map(response => unwrapApiResponse(response, 'Categories could not be loaded.'))
    );
  }
}
