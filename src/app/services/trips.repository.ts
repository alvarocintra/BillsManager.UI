import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Trip, TripAttachment } from '../models/trip.model';

@Injectable({
  providedIn: 'root'
})
export class TripsRepository {
  private readonly apiUrl = environment.apiUrl + '/trips';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.apiUrl, {
      headers: this.getHeaders()
    });
  }

  getTripById(id: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  addTrip(trip: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.apiUrl, trip, {
      headers: this.getHeaders(true, true)
    });
  }

  updateTrip(trip: Trip): Observable<Trip> {
    return this.http.put<Trip>(`${this.apiUrl}/${trip.id}`, trip, {
      headers: this.getHeaders(true, true)
    });
  }

  deleteTrip(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  addLinkAttachment(tripId: string, payload: {
    dayId?: string | null;
    title?: string | null;
    description?: string | null;
    url: string;
    isPhoto?: boolean;
  }): Observable<TripAttachment> {
    return this.http.post<TripAttachment>(`${this.apiUrl}/${tripId}/attachments/link`, payload, {
      headers: this.getHeaders(true, true)
    });
  }

  uploadAttachment(tripId: string, payload: {
    dayId?: string | null;
    title?: string | null;
    description?: string | null;
    isPhoto?: boolean;
    file: File;
  }): Observable<TripAttachment> {
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.dayId) {
      formData.append('dayId', payload.dayId);
    }
    if (payload.title) {
      formData.append('title', payload.title);
    }
    if (payload.description) {
      formData.append('description', payload.description);
    }
    formData.append('isPhoto', String(payload.isPhoto ?? false));

    return this.http.post<TripAttachment>(`${this.apiUrl}/${tripId}/attachments/upload`, formData, {
      headers: this.getHeaders(false, false)
    });
  }

  downloadAttachment(tripId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${tripId}/attachments/${attachmentId}/download`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    });
  }

  deleteAttachment(tripId: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tripId}/attachments/${attachmentId}`, {
      headers: this.getHeaders()
    });
  }

  private getHeaders(includeAuth = true, includeJsonContentType = false): Record<string, string> {
    const headers: Record<string, string> = {};
    if (includeAuth) {
      const token = this.authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }
}
