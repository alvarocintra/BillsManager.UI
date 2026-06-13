import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models/category.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoriesRepository {
  private readonly apiUrl = environment.apiUrl + '/categories';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getCategories(): Observable<Category[]> {
    const token = this.authService.getToken();
    return this.http.get<Category[]>(this.apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }

  addCategory(category: Category): Observable<any> {
    return this.http.post(this.apiUrl, category, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }

  updateCategory(category: Category): Observable<any> {
    return this.http.put(`${this.apiUrl}`, category, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }
}
