import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ImportCommitRequest, ImportCommitResult, ImportPreviewResult } from '../models/import-preview.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ImportsRepository {
  private readonly apiUrl = environment.apiUrl + '/imports';

  constructor(private http: HttpClient, private authService: AuthService) { }

  preview(file: File): Observable<ImportPreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportPreviewResult>(`${this.apiUrl}/preview`, formData, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }

  commit(request: ImportCommitRequest): Observable<ImportCommitResult> {
    return this.http.post<ImportCommitResult>(`${this.apiUrl}/commit`, request, {
      headers: {
        Authorization: `Bearer ${this.authService.getToken()}`
      }
    });
  }
}
