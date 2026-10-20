import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsortiumService } from '../../core/services/consortium.service';
import { ConsortiumDto, CreateConsortiumDto, CreateConsortiumAdminDto, UserDto, UserRole } from '@core/models';

@Component({
  selector: 'app-consortiums',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Administración de Consorcios</h2>
          <p class="subtitle">Gestión de empresas administradoras y asignación de administradores locales</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="pi pi-plus"></i> Nuevo Consorcio
        </button>
      </div>

      <div *ngIf="loading()" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando consorcios...</span>
      </div>

      <!-- Consortiums Grid -->
      <div *ngIf="!loading()" class="consortiums-grid">
        <div *ngFor="let item of consortiums()" class="consortium-card">
          <div class="card-header">
            <div class="icon-wrap">
              <i class="pi pi-briefcase"></i>
            </div>
            <div class="title-wrap">
              <h3>{{ item.name }}</h3>
              <span class="tax-badge" *ngIf="item.taxId">RUT: {{ item.taxId }}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row" *ngIf="item.address">
              <i class="pi pi-map-marker"></i>
              <span>{{ item.address }}</span>
            </div>
            <div class="info-row" *ngIf="item.contactEmail">
              <i class="pi pi-envelope"></i>
              <span>{{ item.contactEmail }}</span>
            </div>
            <div class="info-row" *ngIf="item.contactPhone">
              <i class="pi pi-phone"></i>
              <span>{{ item.contactPhone }}</span>
            </div>

            <div class="metrics-row">
              <div class="metric-pill">
                <span class="metric-num">{{ item._count?.buildings ?? 0 }}</span>
                <span class="metric-lbl">Edificios</span>
              </div>
              <div class="metric-pill">
                <span class="metric-num">{{ item._count?.admins ?? 0 }}</span>
                <span class="metric-lbl">Admins</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-outline" (click)="openAdminsModal(item)">
              <i class="pi pi-users"></i> Administradores ({{ item._count?.admins ?? 0 }})
            </button>
            <div class="action-btns">
              <button class="icon-btn edit" (click)="openEditModal(item)" title="Editar consorcio">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="icon-btn delete" (click)="onDelete(item)" title="Eliminar consorcio">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Crear / Editar Consorcio -->
      <div class="modal-backdrop" *ngIf="showConsortiumModal()">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingId() ? 'Editar Consorcio' : 'Nuevo Consorcio' }}</h3>
            <button class="close-btn" (click)="closeConsortiumModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Nombre del Consorcio / Administradora *</label>
              <input type="text" [(ngModel)]="consortiumForm.name" placeholder="Ej. Administración Del Parque" />
            </div>
            <div class="form-group">
              <label>Dirección *</label>
              <input type="text" [(ngModel)]="consortiumForm.address" placeholder="Ej. Av. Brasil 2650" />
            </div>
            <div class="form-group">
              <label>RUT / Identificador Fiscal</label>
              <input type="text" [(ngModel)]="consortiumForm.taxId" placeholder="Ej. 219998880012" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email de Contacto</label>
                <input type="email" [(ngModel)]="consortiumForm.contactEmail" placeholder="contacto@ejemplo.com" />
              </div>
              <div class="form-group">
                <label>Teléfono</label>
                <input type="text" [(ngModel)]="consortiumForm.contactPhone" placeholder="+598 99 123 456" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeConsortiumModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveConsortium()" [disabled]="!consortiumForm.name || !consortiumForm.address">
              Guardar Consorcio
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Gestión de Administradores del Consorcio -->
      <div class="modal-backdrop" *ngIf="selectedConsortiumForAdmins()">
        <div class="modal-box modal-lg">
          <div class="modal-header">
            <div>
              <h3>Administradores de {{ selectedConsortiumForAdmins()?.name }}</h3>
              <p class="modal-sub">Usuarios con rol de administración asignados a este consorcio</p>
            </div>
            <button class="close-btn" (click)="closeAdminsModal()">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Formulario Alta de Admin -->
            <div class="admin-add-box">
              <h4>+ Dar de Alta Nuevo Administrador</h4>
              <div class="admin-form-grid">
                <input type="text" [(ngModel)]="newAdminForm.fullName" placeholder="Nombre completo *" />
                <input type="email" [(ngModel)]="newAdminForm.email" placeholder="Email (cuenta Google) *" />
                <input type="text" [(ngModel)]="newAdminForm.phone" placeholder="Teléfono" />
                <select [(ngModel)]="newAdminForm.role" class="role-select">
                  <option value="CONDOMINIUM_ADMIN">Admin General de Consorcio</option>
                  <option value="BUILDING_ADMIN">Admin de Edificio(s)</option>
                </select>
              </div>

              <!-- Selector de Edificios para BUILDING_ADMIN -->
              <div class="buildings-selection-box" *ngIf="newAdminForm.role === 'BUILDING_ADMIN'">
                <label class="selection-label">Seleccione los edificios asignados a este administrador:</label>
                <div *ngIf="!selectedConsortiumDetail()?.buildings?.length" class="no-buildings-warn">
                  <i class="pi pi-exclamation-circle"></i> Este consorcio no tiene edificios creados aún. Debe crear un edificio primero para asignarle un administrador.
                </div>
                <div class="buildings-checkboxes" *ngIf="selectedConsortiumDetail()?.buildings?.length">
                  <label *ngFor="let b of selectedConsortiumDetail()?.buildings" class="checkbox-item">
                    <input 
                      type="checkbox" 
                      [checked]="newAdminForm.buildingIds?.includes(b.id)" 
                      (change)="toggleBuildingSelection(b.id)" 
                    />
                    <span>{{ b.name }} ({{ b.address }})</span>
                  </label>
                </div>
              </div>

              <div class="admin-form-actions">
                <button 
                  class="btn btn-primary" 
                  (click)="onAddAdmin()" 
                  [disabled]="!newAdminForm.fullName || !newAdminForm.email || (newAdminForm.role === 'BUILDING_ADMIN' && (!newAdminForm.buildingIds || newAdminForm.buildingIds.length === 0))"
                >
                  <i class="pi pi-user-plus"></i> Asignar Admin
                </button>
              </div>
            </div>

            <!-- Tabla de Administradores Actuales -->
            <h4 class="section-title">Administradores Asignados</h4>
            <div *ngIf="selectedConsortiumDetail()?.admins?.length === 0" class="empty-admins">
              <p>Este consorcio aún no tiene administradores asignados.</p>
            </div>

            <div class="table-responsive" *ngIf="(selectedConsortiumDetail()?.admins?.length ?? 0) > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol & Alcance</th>
                    <th class="actions-col">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let admin of selectedConsortiumDetail()?.admins">
                    <td><strong>{{ admin.fullName }}</strong></td>
                    <td>{{ admin.email }}</td>
                    <td>{{ admin.phone || 'No registrado' }}</td>
                    <td>
                      <div class="role-scope-wrap">
                        <span [class]="admin.role === 'CONDOMINIUM_ADMIN' ? 'role-badge-condo' : 'role-badge-building'">
                          {{ admin.role === 'CONDOMINIUM_ADMIN' ? 'Admin Consorcio (Global)' : 'Admin Edificio(s)' }}
                        </span>
                        <div class="building-tags" *ngIf="admin.administeredBuildings && admin.administeredBuildings.length > 0">
                          <span class="building-tag" *ngFor="let ab of admin.administeredBuildings">
                            🏢 {{ ab.building?.name || ab.name }}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td class="actions-col">
                      <button class="btn-remove" (click)="onRemoveAdmin(admin.id)" title="Desvincular administrador">
                        <i class="pi pi-user-minus"></i> Desvincular
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAdminsModal()">Cerrar</button>
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
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    .consortiums-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.5rem;
    }
    .consortium-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      overflow: hidden;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .consortium-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px -2px rgba(0,0,0,0.08);
    }
    .card-header {
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      border-bottom: 1px solid #f8fafc;
    }
    .icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      flex-shrink: 0;
    }
    .title-wrap h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #0f172a;
      font-weight: 600;
    }
    .tax-badge {
      font-size: 0.725rem;
      background: #f1f5f9;
      color: #475569;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 500;
      display: inline-block;
      margin-top: 0.25rem;
    }
    .card-body {
      padding: 1rem 1.25rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .info-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #475569;
    }
    .info-row i {
      color: #94a3b8;
      font-size: 0.9rem;
      width: 16px;
    }
    .metrics-row {
      display: flex;
      gap: 1rem;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }
    .metric-pill {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
      background: #f8fafc;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
    }
    .metric-num {
      font-weight: 700;
      font-size: 1.1rem;
      color: #0284c7;
    }
    .metric-lbl {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }
    .card-footer {
      padding: 0.875rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .action-btns {
      display: flex;
      gap: 0.35rem;
    }
    .btn {
      padding: 0.45rem 0.9rem;
      border-radius: 6px;
      font-size: 0.825rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #0284c7;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #0369a1;
    }
    .btn-primary:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid #cbd5e1;
      color: #334155;
    }
    .btn-outline:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      color: #64748b;
      transition: all 0.15s ease;
    }
    .icon-btn.edit:hover {
      background: #e0f2fe;
      color: #0284c7;
      border-color: #bae6fd;
    }
    .icon-btn.delete:hover {
      background: #fee2e2;
      color: #dc2626;
      border-color: #fecaca;
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
      backdrop-filter: blur(2px);
    }
    .modal-box {
      background: #ffffff;
      width: 90%;
      max-width: 520px;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow: hidden;
    }
    .modal-box.modal-lg {
      max-width: 780px;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #0f172a;
    }
    .modal-sub {
      margin: 0.2rem 0 0 0;
      font-size: 0.8rem;
      color: #64748b;
    }
    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #94a3b8;
      line-height: 1;
    }
    .close-btn:hover {
      color: #0f172a;
    }
    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      background: #f8fafc;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
    }
    .form-group input {
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #0f172a;
    }
    .form-group input:focus {
      outline: none;
      border-color: #0284c7;
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    /* Admin Add Box */
    .admin-add-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .admin-add-box h4 {
      margin: 0;
      font-size: 0.9rem;
      color: #0f172a;
    }
    .admin-form-grid {
      display: grid;
      grid-template-columns: 1.2fr 1.5fr 1fr 1.3fr;
      gap: 0.5rem;
    }
    .admin-form-grid input, .role-select {
      padding: 0.45rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.8rem;
      background: #ffffff;
      color: #0f172a;
    }
    .role-select:focus, .admin-form-grid input:focus {
      outline: none;
      border-color: #0284c7;
    }
    .buildings-selection-box {
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .selection-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: #334155;
    }
    .buildings-checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: #1e293b;
      cursor: pointer;
    }
    .no-buildings-warn {
      font-size: 0.775rem;
      color: #d97706;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .admin-form-actions {
      display: flex;
      justify-content: flex-end;
    }
    .section-title {
      margin: 0.5rem 0 0 0;
      font-size: 0.9rem;
      color: #0f172a;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.65rem 0.85rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 0.75rem 0.85rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.825rem;
    }
    .role-scope-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      align-items: flex-start;
    }
    .role-badge-condo {
      background: #f3e8ff;
      color: #7e22ce;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
    }
    .role-badge-building {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
    }
    .building-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    .building-tag {
      font-size: 0.7rem;
      background: #f1f5f9;
      color: #334155;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 500;
    }
    .btn-remove {
      background: transparent;
      border: none;
      color: #dc2626;
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .btn-remove:hover {
      text-decoration: underline;
    }
    .empty-admins, .loading-state {
      padding: 2rem;
      text-align: center;
      color: #64748b;
      font-size: 0.875rem;
    }
  `]
})
export class ConsortiumsComponent implements OnInit {
  private readonly consortiumService = inject(ConsortiumService);

  consortiums = signal<ConsortiumDto[]>([]);
  loading = signal<boolean>(true);

  // Modal Crear / Editar Consorcio
  showConsortiumModal = signal<boolean>(false);
  editingId = signal<string | null>(null);
  consortiumForm: CreateConsortiumDto = {
    name: '',
    address: '',
    taxId: '',
    contactEmail: '',
    contactPhone: '',
  };

  // Modal Administradores
  selectedConsortiumForAdmins = signal<ConsortiumDto | null>(null);
  selectedConsortiumDetail = signal<ConsortiumDto | null>(null);
  newAdminForm: CreateConsortiumAdminDto = {
    fullName: '',
    email: '',
    phone: '',
    role: UserRole.CONDOMINIUM_ADMIN,
    buildingIds: [],
  };

  ngOnInit() {
    this.loadConsortiums();
  }

  loadConsortiums() {
    this.loading.set(true);
    this.consortiumService.getConsortiums().subscribe({
      next: (data) => {
        this.consortiums.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreateModal() {
    this.editingId.set(null);
    this.consortiumForm = {
      name: '',
      address: '',
      taxId: '',
      contactEmail: '',
      contactPhone: '',
    };
    this.showConsortiumModal.set(true);
  }

  openEditModal(item: ConsortiumDto) {
    this.editingId.set(item.id);
    this.consortiumForm = {
      name: item.name,
      address: item.address || '',
      taxId: item.taxId || '',
      contactEmail: item.contactEmail || '',
      contactPhone: item.contactPhone || '',
    };
    this.showConsortiumModal.set(true);
  }

  closeConsortiumModal() {
    this.showConsortiumModal.set(false);
    this.editingId.set(null);
  }

  saveConsortium() {
    if (!this.consortiumForm.name || !this.consortiumForm.address) return;

    if (this.editingId()) {
      this.consortiumService.updateConsortium(this.editingId()!, this.consortiumForm).subscribe({
        next: () => {
          this.closeConsortiumModal();
          this.loadConsortiums();
        },
      });
    } else {
      this.consortiumService.createConsortium(this.consortiumForm).subscribe({
        next: () => {
          this.closeConsortiumModal();
          this.loadConsortiums();
        },
      });
    }
  }

  onDelete(item: ConsortiumDto) {
    if (confirm(`¿Estás seguro de eliminar el consorcio "${item.name}"?`)) {
      this.consortiumService.deleteConsortium(item.id).subscribe({
        next: () => this.loadConsortiums(),
        error: (err) => {
          alert(err.error?.message || 'Error al eliminar el consorcio');
        },
      });
    }
  }

  // --- Manejo de Administradores ---
  openAdminsModal(item: ConsortiumDto) {
    this.selectedConsortiumForAdmins.set(item);
    this.loadConsortiumDetail(item.id);
  }

  closeAdminsModal() {
    this.selectedConsortiumForAdmins.set(null);
    this.selectedConsortiumDetail.set(null);
    this.newAdminForm = { fullName: '', email: '', phone: '', role: UserRole.CONDOMINIUM_ADMIN, buildingIds: [] };
    this.loadConsortiums();
  }

  loadConsortiumDetail(id: string) {
    this.consortiumService.getConsortiumById(id).subscribe({
      next: (detail) => this.selectedConsortiumDetail.set(detail),
    });
  }

  toggleBuildingSelection(buildingId: string) {
    const ids = this.newAdminForm.buildingIds || [];
    if (ids.includes(buildingId)) {
      this.newAdminForm.buildingIds = ids.filter((id) => id !== buildingId);
    } else {
      this.newAdminForm.buildingIds = [...ids, buildingId];
    }
  }

  onAddAdmin() {
    const consortium = this.selectedConsortiumForAdmins();
    if (!consortium || !this.newAdminForm.email || !this.newAdminForm.fullName) return;

    this.consortiumService.addAdmin(consortium.id, this.newAdminForm).subscribe({
      next: () => {
        this.newAdminForm = { fullName: '', email: '', phone: '', role: UserRole.CONDOMINIUM_ADMIN, buildingIds: [] };
        this.loadConsortiumDetail(consortium.id);
      },
      error: (err) => alert(err.error?.message || 'Error al asignar administrador'),
    });
  }

  onRemoveAdmin(userId: string) {
    const consortium = this.selectedConsortiumForAdmins();
    if (!consortium) return;

    if (confirm('¿Desvincular este administrador del consorcio?')) {
      this.consortiumService.removeAdmin(consortium.id, userId).subscribe({
        next: () => this.loadConsortiumDetail(consortium.id),
        error: (err) => alert(err.error?.message || 'Error al desvincular administrador'),
      });
    }
  }
}
