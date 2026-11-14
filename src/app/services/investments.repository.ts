import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Investment,
  InvestmentSnapshot,
  InvestmentSnapshotRequest,
  InvestmentSummary,
  InvestmentUpsertRequest
} from '../models/investment.model';

@Injectable({ providedIn: 'root' })
export class InvestmentsRepository {
  private readonly apiUrl = `${environment.apiUrl}/investments`;

  constructor(private http: HttpClient) {}

  getInvestments(): Observable<Investment[]> {
    return this.http.get<Investment[]>(this.apiUrl);
  }

  getInvestment(id: string): Observable<Investment> {
    return this.http.get<Investment>(`${this.apiUrl}/${id}`);
  }

  createInvestment(request: InvestmentUpsertRequest): Observable<Investment> {
    return this.http.post<Investment>(this.apiUrl, request);
  }

  updateInvestment(id: string, request: InvestmentUpsertRequest): Observable<Investment> {
    return this.http.put<Investment>(`${this.apiUrl}/${id}`, request);
  }

  deleteInvestment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addSnapshot(id: string, request: InvestmentSnapshotRequest): Observable<Investment> {
    return this.http.post<Investment>(`${this.apiUrl}/${id}/snapshots`, request);
  }

  getHistory(id: string): Observable<InvestmentSnapshot[]> {
    return this.http.get<InvestmentSnapshot[]>(`${this.apiUrl}/${id}/history`);
  }

  getSummary(currency?: string): Observable<InvestmentSummary> {
    let params = new HttpParams();
    if (currency) params = params.set('currency', currency);
    return this.http.get<InvestmentSummary>(`${this.apiUrl}/summary`, { params });
  }

  getPortfolioHistory(currency: string, from?: string, to?: string): Observable<InvestmentSnapshot[]> {
    let params = new HttpParams().set('currency', currency);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<InvestmentSnapshot[]>(`${this.apiUrl}/history`, { params });
  }
}
