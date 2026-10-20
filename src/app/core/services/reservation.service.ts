import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReservationResponseDto } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/reservations';

  getPendingReservations(buildingId: string): Observable<ReservationResponseDto[]> {
    return this.http.get<ReservationResponseDto[]>(`${this.apiUrl}/pending/${buildingId}`);
  }

  approve(id: string, adminUserId = 'super-admin'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/approve`, { adminUserId });
  }

  reject(id: string, reason: string, adminUserId = 'super-admin'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/reject`, { adminUserId, reason });
  }
}
