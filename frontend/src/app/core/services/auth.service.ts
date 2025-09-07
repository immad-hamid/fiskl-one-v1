import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    sessionToken: string;
    user: {
      email: string;
    };
  };
}

export interface User {
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'session_token';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkStoredSession();
  }

  private checkStoredSession(): void {
    const token = this.getStoredToken();
    if (token) {
      this.verifySession().subscribe({
        next: (response) => {
          if (response.success && response.data?.user) {
            this.currentUserSubject.next(response.data.user);
          } else {
            this.clearSession();
          }
        },
        error: () => {
          this.clearSession();
        }
      });
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storeToken(response.data.sessionToken);
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
      })
    );
  }

  verifySession(): Observable<LoginResponse> {
    const token = this.getStoredToken();
    return this.http.get<LoginResponse>(`${this.apiUrl}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  isLoggedIn(): boolean {
    return !!this.getStoredToken() && !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.getStoredToken();
  }

  private storeToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token);
  }

  private getStoredToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  private clearSession(): void {
    sessionStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }
}