import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { UserDto, UserRole } from '@core/models';

const AUTH_STORAGE_KEY = 'miedificio_auth_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:3000/api/v1/auth';

  currentUser = signal<UserDto | null>(null);

  isAuthenticated = computed(() => !!this.currentUser());
  isSuperAdmin = computed(() => this.currentUser()?.role === UserRole.SUPER_ADMIN);
  isCondoAdmin = computed(() => this.currentUser()?.role === UserRole.CONDOMINIUM_ADMIN);
  isBuildingAdmin = computed(() => this.currentUser()?.role === UserRole.BUILDING_ADMIN);
  isAdmin = computed(() => this.isSuperAdmin() || this.isCondoAdmin() || this.isBuildingAdmin());

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw);
        this.currentUser.set(user);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }

  loginAs(data: { email?: string; role?: string }): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/dev-login`, data).pipe(
      tap((user) => {
        this.currentUser.set(user);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      }),
    );
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  getDevUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/dev-users`);
  }
}
