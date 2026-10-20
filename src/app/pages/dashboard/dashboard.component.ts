import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BuildingService, DashboardStats } from '../../core/services/building.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <div class="header-section">
        <div>
          <h2>{{ authService.isSuperAdmin() ? 'Dashboard Global de Plataforma' : 'Panel de Control' }}</h2>
          <p class="subtitle">
            {{ authService.isSuperAdmin() 
              ? 'Métricas consolidadas y estado general de la plataforma' 
              : 'Estado general y operaciones pendientes de sus edificios' }}
          </p>
        </div>
      </div>

      <!-- Dashboard Grid para SuperAdmin -->
      <div class="dashboard-grid" *ngIf="authService.isSuperAdmin()">
        <!-- 1. Consorcios (en primer posición) -->
        <div class="metric-card">
          <div class="card-icon purple">
            <i class="pi pi-briefcase"></i>
          </div>
          <div class="card-info">
            <h3>Consorcios</h3>
            <p class="metric-value">{{ stats()?.totalConsortiums ?? 0 }}</p>
            <a routerLink="/consortiums" class="card-action">Ver consorcios &rarr;</a>
          </div>
        </div>

        <!-- 2. Edificios Registrados -->
        <div class="metric-card">
          <div class="card-icon primary">
            <i class="pi pi-building"></i>
          </div>
          <div class="card-info">
            <h3>Edificios Registrados</h3>
            <p class="metric-value">{{ stats()?.totalBuildings ?? 0 }}</p>
            <span class="card-subtext">Activos en plataforma</span>
          </div>
        </div>

        <!-- 3. Unidades Totales -->
        <div class="metric-card">
          <div class="card-icon success">
            <i class="pi pi-home"></i>
          </div>
          <div class="card-info">
            <h3>Unidades Totales</h3>
            <p class="metric-value">{{ stats()?.totalUnits ?? 0 }}</p>
            <span class="card-subtext">Departamentos y locales</span>
          </div>
        </div>
      </div>

      <!-- Dashboard Grid para Administrador de Consorcio / Edificio -->
      <div class="dashboard-grid" *ngIf="!authService.isSuperAdmin()">
        <div class="metric-card alert">
          <div class="card-icon warning">
            <i class="pi pi-bell"></i>
          </div>
          <div class="card-info">
            <h3>Reservas Pendientes</h3>
            <p class="metric-value">{{ stats()?.pendingReservations ?? 0 }}</p>
            <a routerLink="/reservations" class="card-action">Revisar solicitudes &rarr;</a>
          </div>
        </div>

        <div class="metric-card">
          <div class="card-icon primary">
            <i class="pi pi-building"></i>
          </div>
          <div class="card-info">
            <h3>Edificios Administrados</h3>
            <p class="metric-value">{{ stats()?.totalBuildings ?? 0 }}</p>
            <a routerLink="/buildings" class="card-action">Ver edificios &rarr;</a>
          </div>
        </div>

        <div class="metric-card">
          <div class="card-icon success">
            <i class="pi pi-home"></i>
          </div>
          <div class="card-info">
            <h3>Unidades Totales</h3>
            <p class="metric-value">{{ stats()?.totalUnits ?? 0 }}</p>
            <span class="card-subtext">Departamentos y locales</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="card-icon purple">
            <i class="pi pi-calendar-plus"></i>
          </div>
          <div class="card-info">
            <h3>Amenities Disponibles</h3>
            <p class="metric-value">{{ stats()?.activeAmenities ?? 0 }}</p>
            <a routerLink="/amenities" class="card-action">Ver configuración &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .header-section h2 {
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
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }
    .metric-card {
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
    }
    .card-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .card-icon.warning {
      background-color: #fef3c7;
      color: #d97706;
    }
    .card-icon.primary {
      background-color: #e0f2fe;
      color: #0284c7;
    }
    .card-icon.success {
      background-color: #dcfce7;
      color: #16a34a;
    }
    .card-icon.purple {
      background-color: #f3e8ff;
      color: #9333ea;
    }
    .card-info h3 {
      margin: 0;
      font-size: 0.825rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      color: #64748b;
    }
    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0.25rem 0;
      line-height: 1;
    }
    .card-action {
      font-size: 0.8rem;
      font-weight: 600;
      color: #0284c7;
      text-decoration: none;
    }
    .card-action:hover {
      text-decoration: underline;
    }
    .card-subtext {
      font-size: 0.775rem;
      color: #94a3b8;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly buildingService = inject(BuildingService);
  readonly authService = inject(AuthService);
  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.buildingService.getDashboardStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Error loading dashboard stats:', err),
    });
  }
}
