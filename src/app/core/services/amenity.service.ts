import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AmenityDto } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class AmenityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/amenities';

  getAmenitiesByBuilding(buildingId: string, moduleId?: string): Observable<AmenityDto[]> {
    const url = moduleId
      ? `${this.apiUrl}/building/${buildingId}?moduleId=${moduleId}`
      : `${this.apiUrl}/building/${buildingId}`;
    return this.http.get<AmenityDto[]>(url);
  }

  getAmenityById(id: string): Observable<AmenityDto> {
    return this.http.get<AmenityDto>(`${this.apiUrl}/${id}`);
  }
}
