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

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = 'https://localhost:7039/api/Products';

  constructor(private readonly http: HttpClient) {}

  getProducts() {
    return this.http.get<ApiResponse<Product[]>>(this.apiUrl).pipe(
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
