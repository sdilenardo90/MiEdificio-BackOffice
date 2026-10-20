import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmenityService } from '../../core/services/amenity.service';
import { BuildingService } from '../../core/services/building.service';
import { AmenityDto } from '@core/models';

@Component({
  selector: 'app-amenities',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Catálogo de Amenities y Salones</h2>
          <p class="subtitle">Espacios comunes y áreas exclusivas configuradas para el edificio</p>
        </div>
      </div>

      <div *ngIf="loading()" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando salones...</span>
      </div>

      <div *ngIf="!loading()" class="amenities-grid">
        <div *ngFor="let item of amenities()" class="amenity-card">
          <div class="card-top">
            <div class="card-icon">
              <i class="pi" [ngClass]="getIcon(item.name)"></i>
            </div>
            <span class="scope-pill" [ngClass]="item.scope === 'GENERAL' ? 'general' : 'exclusive'">
              {{ item.scope === 'GENERAL' ? 'Uso General' : 'Exclusivo Módulo' }}
            </span>
          </div>

          <div class="card-body">
            <h3>{{ item.name }}</h3>
            <p class="desc">{{ item.description }}</p>

            <div class="specs-list">
              <div class="spec-row">
                <span class="label"><i class="pi pi-clock"></i> Horario:</span>
                <span class="val">{{ item.openingTime }} - {{ item.closingTime }} hs</span>
              </div>
              <div class="spec-row">
                <span class="label"><i class="pi pi-hourglass"></i> Duración Turno:</span>
                <span class="val">{{ formatDuration(item.slotDurationMinutes) }}</span>
              </div>
              <div class="spec-row">
                <span class="label"><i class="pi pi-tag"></i> Tarifa de Uso:</span>
                <span class="val price">{{ item.costPerSlot | currency:'UYU':'symbol':'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <span *ngIf="item.requiresApproval" class="approval-badge">
              <i class="pi pi-shield"></i> Requiere Aprobación
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .page-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }
    .subtitle {
      margin: 0.25rem 0 0 0;
      color: #64748b;
      font-size: 0.875rem;
    }
    .amenities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .amenity-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .amenity-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px -2px rgba(0,0,0,0.08);
    }
    .card-top {
      padding: 1.25rem 1.25rem 0.5rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #f0fdf4;
      color: #16a34a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }
    .scope-pill {
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .scope-pill.general {
      background: #e0f2fe;
      color: #0369a1;
    }
    .scope-pill.exclusive {
      background: #f3e8ff;
      color: #7e22ce;
    }
    .card-body {
      padding: 1rem 1.25rem;
      flex: 1;
    }
    .card-body h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 600;
      color: #0f172a;
    }
    .desc {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0.5rem 0 1rem 0;
      line-height: 1.4;
      min-height: 2.8rem;
    }
    .specs-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: 8px;
    }
    .spec-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
    }
    .spec-row .label {
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .spec-row .val {
      font-weight: 600;
      color: #1e293b;
    }
    .spec-row .val.price {
      color: #0284c7;
    }
    .card-footer {
      padding: 0.875rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      background: #ffffff;
    }
    .approval-badge {
      font-size: 0.775rem;
      color: #059669;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .loading-state {
      padding: 3rem;
      text-align: center;
      color: #64748b;
    }
  `]
})
export class AmenitiesComponent implements OnInit {
  private readonly amenityService = inject(AmenityService);
  private readonly buildingService = inject(BuildingService);

  amenities = signal<AmenityDto[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.buildingService.getBuildings().subscribe({
      next: (buildings) => {
        if (buildings.length > 0) {
          this.amenityService.getAmenitiesByBuilding(buildings[0].id).subscribe({
            next: (data) => {
              this.amenities.set(data);
              this.loading.set(false);
            },
            error: () => this.loading.set(false),
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  getIcon(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('barbacoa') || lower.includes('parrilla')) return 'pi-sun';
    if (lower.includes('sauna') || lower.includes('spa')) return 'pi-sparkles';
    if (lower.includes('masaje')) return 'pi-heart';
    return 'pi-building';
  }

  formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const hours = minutes / 60;
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    return `${minutes} min`;
  }
}
