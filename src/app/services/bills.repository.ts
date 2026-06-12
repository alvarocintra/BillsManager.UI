import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Bill } from '../models/bill.model';
import { PagedResult } from '../models/paged-result.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BillsRepository {
  private readonly apiUrl = environment.apiUrl + '/bills';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getBills(
    pageNumber: number,
    pageSize: number,
    title: string | null = null,
    type: string | null = null,
    category: string | null = null,
    paid: string | null = null,
    fromDueDate: Date | null = null,
    toDueDate: Date | null = null,
    fromAmount: number | null = null,
    toAmount: number | null = null,
    fromCreatedAt: Date | null = null,
    toCreatedAt: Date | null = null,
    sortBy: string | null = 'createdAt',
    sortOrder: string | null = 'desc'): Observable<PagedResult<Bill>> {
      const token = this.authService.getToken();
      console.log(`Fetching bills using token: ${token}`);
    return this.http.get<PagedResult<Bill>>(this.apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        pageNumber,
        pageSize,
        title: title || '',
        type: type || '',
        category: category || '',
        paid: paid !== undefined ? String(paid) : '',
        fromDueDate: fromDueDate ? fromDueDate.toISOString() : '',
        toDueDate: toDueDate ? toDueDate.toISOString() : '',
        fromAmount: fromAmount !== null ? String(fromAmount) : '',
        toAmount: toAmount !== null ? String(toAmount) : '',
        fromCreatedAt: fromCreatedAt ? fromCreatedAt.toISOString() : '',
        toCreatedAt: toCreatedAt ? toCreatedAt.toISOString() : '',
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc'
      }
    });
  }

  getBillById(id: string): Observable<Bill> {
    const token = this.authService.getToken();
    console.log(`Fetching bill with ID: ${id} using token: ${token}`);
    return this.http.get<Bill>(`${this.apiUrl}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  addBill(bill: Bill): Observable<any> {
    return this.http.post(this.apiUrl, bill, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }

  updateBill(bill: Bill): Observable<any> {
    return this.http.put(`${this.apiUrl}`, bill, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }

  deleteBill(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }
}
