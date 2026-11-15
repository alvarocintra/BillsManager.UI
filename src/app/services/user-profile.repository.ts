import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UpdateUserProfile, UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class UserProfileRepository {
  private readonly apiUrl = `${environment.apiUrl}/users/me`;

  constructor(private readonly http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  updateProfile(update: UpdateUserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.apiUrl, update);
  }
}
