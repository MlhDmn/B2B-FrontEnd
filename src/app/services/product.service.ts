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
  image: File | null;
  stockQuantity: number;
  description: string;
  categoryId: number;
}

export interface ProductUpdateRequest {
  id: number;
  name: string;
  price: number;
  origin: string;
  sizeRange: string;
  material: string;
  gender: ProductGender;
  image: File | null;
  stockQuantity: number;
  description: string;
  categoryId: number;
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
  private readonly apiOrigin = 'http://localhost:5072';
  private readonly apiUrl = `${this.apiOrigin}/api/Products`;

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
      map(response => {
        const page = unwrapApiResponse(response, 'Products could not be loaded.');
        return {
          ...page,
          items: page.items.map(product => this.normalizeProductImageUrl(product))
        };
      })
    );
  }

  getProduct(id: number) {
    return this.http.get<ApiResponse<Product>>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.normalizeProductImageUrl(
        unwrapApiResponse(response, 'Product could not be loaded.')
      ))
    );
  }

  createProduct(request: ProductCreateRequest) {
    return this.http.post<ApiResponse<Product>>(this.apiUrl, this.toCreateFormData(request)).pipe(
      map(response => this.normalizeProductImageUrl(
        unwrapApiResponse(response, 'Product could not be created.')
      ))
    );
  }

  updateProduct(request: ProductUpdateRequest) {
    return this.http.put<ApiResponse<Product>>(`${this.apiUrl}/${request.id}`, this.toUpdateFormData(request)).pipe(
      map(response => this.normalizeProductImageUrl(
        unwrapApiResponse(response, 'Product could not be updated.')
      ))
    );
  }

  private toCreateFormData(request: ProductCreateRequest): FormData {
    const formData = this.toProductFormData(request);

    if (request.image) {
      formData.append('image', request.image);
    }

    return formData;
  }

  private toUpdateFormData(request: ProductUpdateRequest): FormData {
    const formData = this.toProductFormData(request);

    formData.append('id', String(request.id));
    formData.append('isActive', String(request.isActive));

    if (request.image) {
      formData.append('image', request.image);
    }

    return formData;
  }

  private toProductFormData(request: ProductCreateRequest | ProductUpdateRequest): FormData {
    const formData = new FormData();

    formData.append('name', request.name);
    formData.append('price', String(request.price));
    formData.append('origin', request.origin);
    formData.append('sizeRange', request.sizeRange);
    formData.append('material', request.material);
    formData.append('gender', String(request.gender));
    formData.append('stockQuantity', String(request.stockQuantity));
    formData.append('description', request.description);
    formData.append('categoryId', String(request.categoryId));

    return formData;
  }

  private normalizeProductImageUrl(product: Product): Product {
    if (!product.imageUrl || product.imageUrl.startsWith('http')) {
      return product;
    }

    return {
      ...product,
      imageUrl: `${this.apiOrigin}${product.imageUrl}`
    };
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
