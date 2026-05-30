import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ImportCommitRequest, ImportCommitResult, ImportPreviewResult } from '../models/import-preview.model';

@Injectable({
  providedIn: 'root'
})
export class ImportsRepository {
  private readonly apiUrl = 'http://localhost:5013/imports';

  constructor(private http: HttpClient) { }

  preview(file: File): Observable<ImportPreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportPreviewResult>(`${this.apiUrl}/preview`, formData);
  }

  commit(request: ImportCommitRequest): Observable<ImportCommitResult> {
    return this.http.post<ImportCommitResult>(`${this.apiUrl}/commit`, request);
  }
}
