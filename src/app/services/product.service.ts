import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiResponse, unwrapApiResponse } from './api-response';

export enum ProductGender {
  Unisex = 1,
  Men = 2,
  Women = 3,
  Kids = 4
}

export interface Product {
  id: number;
  name: string;
  price: number;
  origin: string;
  sizeRange: string;
  material: string;
  gender: ProductGender;
  imageUrl: string;
  stockQuantity: number;
  description: string;
  categoryId: number;
  categoryName: string;
  categoryDescription: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProductCreateRequest {
  name: string;
  price: number;
  origin: string;
  sizeRange: string;
  material: string;
  gender: ProductGender;
  imageUrl: string;
  stockQuantity: number;
  description: string;
  categoryId: number;
}

export interface ProductUpdateRequest extends ProductCreateRequest {
  id: number;
  isActive: boolean;
}

export interface PagedProductsResponse {
  items: Product[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ProductListFilters {
  searchTerm?: string;
  categoryId?: number;
  gender?: ProductGender;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = 'http://localhost:5072/api/Products';

  constructor(private readonly http: HttpClient) {}

  getProducts(pageNumber = 1, pageSize = 20, filters: ProductListFilters = {}) {
    const params = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize)
    });

    const normalizedSearchTerm = filters.searchTerm?.trim();
    if (normalizedSearchTerm) {
      params.set('searchTerm', normalizedSearchTerm);
    }

    if (filters.categoryId) {
      params.set('categoryId', String(filters.categoryId));
    }

    if (filters.gender) {
      params.set('gender', String(filters.gender));
    }

    if (filters.minPrice !== undefined) {
      params.set('minPrice', String(filters.minPrice));
    }

    if (filters.maxPrice !== undefined) {
      params.set('maxPrice', String(filters.maxPrice));
    }

    if (filters.inStockOnly) {
      params.set('inStockOnly', 'true');
    }

    return this.http.get<ApiResponse<PagedProductsResponse>>(
      `${this.apiUrl}?${params.toString()}`
    ).pipe(
      map(response => unwrapApiResponse(response, 'Products could not be loaded.'))
    );
  }

  getProduct(id: number) {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
      map(response => unwrapApiResponse(response, 'Product could not be loaded.'))
    );
  }

  createProduct(request: ProductCreateRequest) {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, request).pipe(
      map(response => unwrapApiResponse(response, 'Product could not be created.'))
    );
  }

  updateProduct(request: ProductUpdateRequest) {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${request.id}`, request).pipe(
      map(response => unwrapApiResponse(response, 'Product could not be updated.'))
    );
  }
}

export function getProductGenderLabel(gender: ProductGender): string {
  switch (gender) {
    case ProductGender.Unisex:
      return 'Unisex';
    case ProductGender.Men:
      return 'Men';
    case ProductGender.Women:
      return 'Women';
    case ProductGender.Kids:
      return 'Kids';
    default:
      return 'Unknown';
  }
}
