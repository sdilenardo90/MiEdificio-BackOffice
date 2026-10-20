import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  BuildingDto,
  CreateBuildingDto,
  BuildingModuleDto,
  CreateBuildingModuleDto,
  UnitDto,
  CreateUnitDto,
  UpdateUnitDto,
} from '@core/models';

export interface DashboardStats {
  totalBuildings: number;
  totalUnits: number;
  pendingReservations: number;
  activeAmenities: number;
  totalConsortiums?: number;
}

export type BuildingDetailDto = BuildingDto & {
  modules: BuildingModuleDto[];
  units: UnitDto[];
  amenities: any[];
  admins: any[];
};

@Injectable({
  providedIn: 'root',
})
export class BuildingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/v1/buildings';

  buildings = signal<BuildingDto[]>([]);
  selectedBuilding = signal<BuildingDto | null>(null);

  getBuildings(consortiumId?: string): Observable<BuildingDto[]> {
    const url = consortiumId ? `${this.apiUrl}?consortiumId=${consortiumId}` : this.apiUrl;
    return this.http.get<BuildingDto[]>(url).pipe(
      tap((data) => {
        this.buildings.set(data);
        if (data.length > 0 && !this.selectedBuilding()) {
          this.selectedBuilding.set(data[0]);
        }
      }),
    );
  }

  getBuildingById(id: string): Observable<BuildingDetailDto> {
    return this.http.get<BuildingDetailDto>(`${this.apiUrl}/${id}`);
  }

  createBuilding(data: CreateBuildingDto): Observable<BuildingDto> {
    return this.http.post<BuildingDto>(this.apiUrl, data);
  }

  updateBuilding(id: string, data: Partial<CreateBuildingDto>): Observable<BuildingDto> {
    return this.http.put<BuildingDto>(`${this.apiUrl}/${id}`, data);
  }

  deleteBuilding(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  createModule(buildingId: string, data: CreateBuildingModuleDto): Observable<BuildingModuleDto> {
    return this.http.post<BuildingModuleDto>(`${this.apiUrl}/${buildingId}/modules`, data);
  }

  deleteModule(buildingId: string, moduleId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${buildingId}/modules/${moduleId}`);
  }

  getUnits(buildingId: string): Observable<UnitDto[]> {
    return this.http.get<UnitDto[]>(`${this.apiUrl}/${buildingId}/units`);
  }

  createUnit(buildingId: string, data: CreateUnitDto): Observable<UnitDto> {
    return this.http.post<UnitDto>(`${this.apiUrl}/${buildingId}/units`, data);
  }

  updateUnit(buildingId: string, unitId: string, data: UpdateUnitDto): Observable<UnitDto> {
    return this.http.put<UnitDto>(`${this.apiUrl}/${buildingId}/units/${unitId}`, data);
  }

  deleteUnit(buildingId: string, unitId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${buildingId}/units/${unitId}`);
  }

  assignAdmin(buildingId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${buildingId}/admins`, { userId });
  }

  removeAdmin(buildingId: string, userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${buildingId}/admins/${userId}`);
  }

  getDashboardStats(buildingId?: string): Observable<DashboardStats> {
    const url = buildingId
      ? `${this.apiUrl}/dashboard-stats?buildingId=${buildingId}`
      : `${this.apiUrl}/dashboard-stats`;
    return this.http.get<DashboardStats>(url);
  }

  selectBuilding(building: BuildingDto) {
    this.selectedBuilding.set(building);
  }
}
