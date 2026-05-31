import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Bill } from '../models/bill.model';
import { PagedResult } from '../models/paged-result.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BillsRepository {
  private readonly apiUrl = environment.apiUrl + '/bills';

  constructor(private http: HttpClient) { }

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
  sortBy: string | null = 'createdAt',
  sortOrder: string | null = 'desc'): Observable<PagedResult<Bill>> {
  return this.http.get<PagedResult<Bill>>(this.apiUrl, {
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
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    }
  });
}

  getBillById(id: string): Observable<Bill> {
    return this.http.get<Bill>(`${this.apiUrl}/${id}`);
  }

  addBill(bill: Bill): Observable<any> {
    return this.http.post(this.apiUrl, bill);
  }

  updateBill(bill: Bill): Observable<any> {
    return this.http.put(`${this.apiUrl}`, bill);
  }

  deleteBill(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
