import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../core/services/reservation.service';
import { BuildingService } from '../../core/services/building.service';
import { ReservationResponseDto } from '@core/models';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Gestión de Reservas de Salones</h2>
          <p class="subtitle">Aprobación y control de turnos solicitados por los residentes</p>
        </div>
      </div>

      <div class="content-card">
        <div class="card-header">
          <h3>Solicitudes Pendientes de Aprobación</h3>
          <span class="badge warning">{{ reservations().length }} pendientes</span>
        </div>

        <div *ngIf="loading()" class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Cargando solicitudes...</span>
        </div>

        <div *ngIf="!loading() && reservations().length === 0" class="empty-state">
          <i class="pi pi-check-circle success-icon"></i>
          <h4>¡Todo al día!</h4>
          <p>No hay reservas pendientes de aprobación para este edificio.</p>
        </div>

        <div *ngIf="!loading() && reservations().length > 0" class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Salón / Amenity</th>
                <th>Unidad</th>
                <th>Residente</th>
                <th>Fecha y Turno</th>
                <th>Tarifa</th>
                <th>Estado</th>
                <th class="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let res of reservations()">
                <td>
                  <strong>{{ res.amenity?.name }}</strong>
                </td>
                <td>
                  <span class="unit-pill">{{ res.unit?.code }}</span>
                </td>
                <td>
                  <div class="user-cell">
                    <span class="user-name">{{ res.user?.fullName }}</span>
                    <span class="user-email">{{ res.user?.email }}</span>
                  </div>
                </td>
                <td>
                  <div class="time-cell">
                    <span class="date">{{ res.startTime | date:'dd/MM/yyyy' }}</span>
                    <span class="time">{{ res.startTime | date:'HH:mm' }} - {{ res.endTime | date:'HH:mm' }}</span>
                  </div>
                </td>
                <td>
                  <strong>{{ res.cost | currency:'UYU':'symbol':'1.0-0' }}</strong>
                </td>
                <td>
                  <span class="status-badge pending">Pendiente</span>
                </td>
                <td class="actions-col">
                  <button class="btn btn-approve" (click)="onApprove(res.id)" title="Aprobar reserva">
                    <i class="pi pi-check"></i> Aprobar
                  </button>
                  <button class="btn btn-reject" (click)="onReject(res.id)" title="Rechazar reserva">
                    <i class="pi pi-times"></i> Rechazar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
    .content-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #1e293b;
    }
    .badge.warning {
      background: #fef3c7;
      color: #b45309;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.875rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
      color: #334155;
    }
    .unit-pill {
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.8rem;
      color: #475569;
    }
    .user-cell {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-weight: 600;
      color: #0f172a;
    }
    .user-email {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .time-cell {
      display: flex;
      flex-direction: column;
    }
    .date {
      font-weight: 500;
    }
    .time {
      font-size: 0.75rem;
      color: #64748b;
    }
    .status-badge.pending {
      background: #fef3c7;
      color: #b45309;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .actions-col {
      text-align: right;
    }
    .btn {
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s ease;
      margin-left: 0.5rem;
    }
    .btn-approve {
      background: #16a34a;
      color: #ffffff;
    }
    .btn-approve:hover {
      background: #15803d;
    }
    .btn-reject {
      background: #dc2626;
      color: #ffffff;
    }
    .btn-reject:hover {
      background: #b91c1c;
    }
    .loading-state, .empty-state {
      padding: 3rem 1.5rem;
      text-align: center;
      color: #64748b;
    }
    .success-icon {
      font-size: 2.5rem;
      color: #16a34a;
      margin-bottom: 0.5rem;
    }
  `]
})
export class ReservationsComponent implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly buildingService = inject(BuildingService);

  reservations = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.buildingService.getBuildings().subscribe({
      next: (buildings) => {
        if (buildings.length > 0) {
          const buildingId = buildings[0].id;
          this.reservationService.getPendingReservations(buildingId).subscribe({
            next: (data) => {
              this.reservations.set(data);
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

  onApprove(id: string) {
    this.reservationService.approve(id).subscribe({
      next: () => {
        this.reservations.update((list) => list.filter((r) => r.id !== id));
      },
    });
  }

  onReject(id: string) {
    const reason = prompt('Indica el motivo del rechazo:') || 'No disponible para esa fecha';
    this.reservationService.reject(id, reason).subscribe({
      next: () => {
        this.reservations.update((list) => list.filter((r) => r.id !== id));
      },
    });
  }
}
