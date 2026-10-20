import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConsortiumDto, CreateConsortiumDto, UpdateConsortiumDto, CreateConsortiumAdminDto, UserDto } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class ConsortiumService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/consortiums';

  getConsortiums(): Observable<ConsortiumDto[]> {
    return this.http.get<ConsortiumDto[]>(this.apiUrl);
  }

  getConsortiumById(id: string): Observable<ConsortiumDto> {
    return this.http.get<ConsortiumDto>(`${this.apiUrl}/${id}`);
  }

  createConsortium(data: CreateConsortiumDto): Observable<ConsortiumDto> {
    return this.http.post<ConsortiumDto>(this.apiUrl, data);
  }

  updateConsortium(id: string, data: UpdateConsortiumDto): Observable<ConsortiumDto> {
    return this.http.put<ConsortiumDto>(`${this.apiUrl}/${id}`, data);
  }

  deleteConsortium(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addAdmin(consortiumId: string, data: CreateConsortiumAdminDto): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/${consortiumId}/admins`, data);
  }

  removeAdmin(consortiumId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${consortiumId}/admins/${userId}`);
  }
}
