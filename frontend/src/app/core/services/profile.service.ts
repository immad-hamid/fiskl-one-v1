import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Profile } from '../models/profile';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:3000/api/profiles';

  constructor(private http: HttpClient) { }

  getProfiles(): Observable<{ success: boolean; data: Profile[]; message: string }> {
    return this.http.get<{ success: boolean; data: Profile[]; message: string }>(this.apiUrl);
  }

  getProfileById(id: number): Observable<{ success: boolean; data: Profile; message: string }> {
    return this.http.get<{ success: boolean; data: Profile; message: string }>(`${this.apiUrl}/${id}`);
  }

  createProfile(profile: Profile): Observable<{ success: boolean; data: Profile; message: string }> {
    return this.http.post<{ success: boolean; data: Profile; message: string }>(this.apiUrl, profile);
  }

  updateProfile(id: number, profile: Profile): Observable<{ success: boolean; data: Profile; message: string }> {
    return this.http.put<{ success: boolean; data: Profile; message: string }>(`${this.apiUrl}/${id}`, profile);
  }

  deleteProfile(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  setDefaultProfile(id: number): Observable<{ success: boolean; data: Profile; message: string }> {
    return this.http.patch<{ success: boolean; data: Profile; message: string }>(`${this.apiUrl}/${id}/set-default`, {});
  }
}
