import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuildingService, BuildingDetailDto } from '../../core/services/building.service';
import { ConsortiumService } from '../../core/services/consortium.service';
import {
  BuildingDto,
  CreateBuildingDto,
  BuildingModuleDto,
  CreateBuildingModuleDto,
  UnitDto,
  CreateUnitDto,
  UpdateUnitDto,
  ConsortiumDto,
} from '@core/models';

@Component({
  selector: 'app-buildings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Gestión de Edificios & Unidades</h2>
          <p class="subtitle">Administración de edificios, torres/módulos, apartamentos y administradores delegados</p>
        </div>
        <div class="header-actions">
          <select 
            class="consortium-filter" 
            [(ngModel)]="selectedConsortiumFilter" 
            (change)="onConsortiumFilterChange()"
          >
            <option value="">Todos los Consorcios</option>
            <option *ngFor="let c of consortiums()" [value]="c.id">{{ c.name }}</option>
          </select>
          <button class="btn btn-primary" (click)="openCreateBuildingModal()">
            <i class="pi pi-plus"></i> Nuevo Edificio
          </button>
        </div>
      </div>

      <div *ngIf="loading()" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando edificios...</span>
      </div>

      <!-- Buildings Grid -->
      <div *ngIf="!loading()" class="buildings-grid">
        <div *ngIf="buildings().length === 0" class="empty-state">
          <i class="pi pi-building empty-icon"></i>
          <h3>No hay edificios registrados</h3>
          <p>Crea el primer edificio para comenzar a estructurar módulos y unidades funcionales.</p>
          <button class="btn btn-primary" (click)="openCreateBuildingModal()">
            <i class="pi pi-plus"></i> Crear Edificio
          </button>
        </div>

        <div *ngFor="let item of buildings()" class="building-card">
          <div class="card-header">
            <div class="icon-wrap">
              <i class="pi pi-building"></i>
            </div>
            <div class="title-wrap">
              <h3>{{ item.name }}</h3>
              <span class="consortium-badge">{{ item.consortium?.name || 'Consorcio' }}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="info-row">
              <i class="pi pi-map-marker"></i>
              <span>{{ item.address }}, {{ item.city }}</span>
            </div>
            <div class="info-row">
              <i class="pi pi-globe"></i>
              <span>{{ item.country }} ({{ item.timezone }})</span>
            </div>

            <div class="metrics-row">
              <div class="metric-pill">
                <span class="metric-num">{{ item._count?.units ?? 0 }}</span>
                <span class="metric-lbl">Unidades</span>
              </div>
              <div class="metric-pill">
                <span class="metric-num">{{ item.modules?.length ?? 0 }}</span>
                <span class="metric-lbl">Torres/Módulos</span>
              </div>
              <div class="metric-pill">
                <span class="metric-num">{{ item._count?.admins ?? 0 }}</span>
                <span class="metric-lbl">Admins</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn btn-outline" (click)="openManageBuilding(item)">
              <i class="pi pi-sliders-h"></i> Gestionar Unidades & Torres
            </button>
            <div class="action-btns">
              <button class="icon-btn edit" (click)="openEditBuildingModal(item)" title="Editar edificio">
                <i class="pi pi-pencil"></i>
              </button>
              <button class="icon-btn delete" (click)="onDeleteBuilding(item)" title="Eliminar edificio">
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Crear / Editar Edificio -->
      <div class="modal-backdrop" *ngIf="showBuildingModal()">
        <div class="modal-box">
          <div class="modal-header">
            <h3>{{ editingBuildingId() ? 'Editar Edificio' : 'Nuevo Edificio' }}</h3>
            <button class="close-btn" (click)="closeBuildingModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group" *ngIf="!editingBuildingId()">
              <label>Consorcio Perteneciente *</label>
              <select [(ngModel)]="buildingForm.consortiumId">
                <option value="" disabled>Seleccione un consorcio...</option>
                <option *ngFor="let c of consortiums()" [value]="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Nombre del Edificio *</label>
              <input type="text" [(ngModel)]="buildingForm.name" placeholder="Ej. Edificio Altos del Parque" />
            </div>
            <div class="form-group">
              <label>Dirección *</label>
              <input type="text" [(ngModel)]="buildingForm.address" placeholder="Ej. Bv. Artigas 1234" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Ciudad</label>
                <input type="text" [(ngModel)]="buildingForm.city" placeholder="Montevideo" />
              </div>
              <div class="form-group">
                <label>País</label>
                <input type="text" [(ngModel)]="buildingForm.country" placeholder="Uruguay" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeBuildingModal()">Cancelar</button>
            <button 
              class="btn btn-primary" 
              (click)="saveBuilding()" 
              [disabled]="!buildingForm.name || !buildingForm.address || (!editingBuildingId() && !buildingForm.consortiumId)"
            >
              Guardar Edificio
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Grande: Gestión Detallada del Edificio (Módulos & Unidades) -->
      <div class="modal-backdrop" *ngIf="activeBuildingDetail()">
        <div class="modal-box modal-xl">
          <div class="modal-header">
            <div>
              <h3>{{ activeBuildingDetail()?.name }}</h3>
              <p class="modal-sub">
                <i class="pi pi-map-marker"></i> {{ activeBuildingDetail()?.address }} &bull; {{ activeBuildingDetail()?.consortium?.name }}
              </p>
            </div>
            <button class="close-btn" (click)="closeManageBuilding()">&times;</button>
          </div>

          <!-- Pestañas de Navegación -->
          <div class="modal-tabs">
            <button 
              class="tab-btn" 
              [class.active]="activeTab() === 'units'" 
              (click)="activeTab.set('units')"
            >
              <i class="pi pi-home"></i> Unidades Funcionales ({{ units().length }})
            </button>
            <button 
              class="tab-btn" 
              [class.active]="activeTab() === 'modules'" 
              (click)="activeTab.set('modules')"
            >
              <i class="pi pi-th-large"></i> Torres / Módulos ({{ activeBuildingDetail()?.modules?.length ?? 0 }})
            </button>
            <button 
              class="tab-btn" 
              [class.active]="activeTab() === 'admins'" 
              (click)="activeTab.set('admins')"
            >
              <i class="pi pi-users"></i> Administradores Asignados ({{ activeBuildingDetail()?.admins?.length ?? 0 }})
            </button>
          </div>

          <div class="modal-body">
            <!-- TAB 1: UNIDADES FUNCIONALES -->
            <div *ngIf="activeTab() === 'units'" class="tab-content">
              <!-- Formulario de Alta de Unidad -->
              <div class="quick-add-card">
                <h4>+ Agregar Unidad Funcional</h4>
                <div class="unit-form-grid">
                  <div class="input-wrap">
                    <label>Código / Apto *</label>
                    <input type="text" [(ngModel)]="newUnitForm.code" placeholder="Ej. Apto 302, Local 1" />
                  </div>
                  <div class="input-wrap">
                    <label>Piso</label>
                    <input type="text" [(ngModel)]="newUnitForm.floor" placeholder="Ej. 3, PB" />
                  </div>
                  <div class="input-wrap">
                    <label>Torre / Módulo</label>
                    <select [(ngModel)]="newUnitForm.moduleId">
                      <option [ngValue]="null">Sin Torre / General</option>
                      <option *ngFor="let m of activeBuildingDetail()?.modules" [value]="m.id">{{ m.name }}</option>
                    </select>
                  </div>
                  <div class="btn-wrap">
                    <button class="btn btn-primary" (click)="onAddUnit()" [disabled]="!newUnitForm.code">
                      <i class="pi pi-plus"></i> Agregar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Filtro y Tabla de Unidades -->
              <div class="table-header-row">
                <h4>Unidades Registradas ({{ filteredUnits().length }})</h4>
                <div class="filters-wrap">
                  <select [(ngModel)]="unitModuleFilter" class="filter-select">
                    <option value="">Todas las Torres</option>
                    <option *ngFor="let m of activeBuildingDetail()?.modules" [value]="m.id">{{ m.name }}</option>
                  </select>
                </div>
              </div>

              <div *ngIf="unitsLoading()" class="loading-state">
                <i class="pi pi-spin pi-spinner"></i>
                <span>Cargando unidades...</span>
              </div>

              <div *ngIf="!unitsLoading() && filteredUnits().length === 0" class="empty-tab">
                <p>No se encontraron unidades funcionales registradas.</p>
              </div>

              <div class="table-responsive" *ngIf="!unitsLoading() && filteredUnits().length > 0">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Piso</th>
                      <th>Torre / Módulo</th>
                      <th>Ocupantes</th>
                      <th class="actions-col">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let unit of filteredUnits()">
                      <td><strong>{{ unit.code }}</strong></td>
                      <td>{{ unit.floor || '-' }}</td>
                      <td>
                        <span class="module-badge" *ngIf="unit.module">
                          {{ unit.module.name }}
                        </span>
                        <span class="general-badge" *ngIf="!unit.module">General</span>
                      </td>
                      <td>
                        <span class="occupant-badge" [class.vacant]="(unit._count?.userUnits ?? 0) === 0">
                          {{ (unit._count?.userUnits ?? 0) > 0 ? (unit._count?.userUnits + ' ocupante(s)') : 'Vacante' }}
                        </span>
                      </td>
                      <td class="actions-col">
                        <button class="btn-remove" (click)="onDeleteUnit(unit.id)" title="Eliminar unidad">
                          <i class="pi pi-trash"></i> Eliminar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- TAB 2: MÓDULOS / TORRES -->
            <div *ngIf="activeTab() === 'modules'" class="tab-content">
              <!-- Formulario de Alta de Módulo -->
              <div class="quick-add-card">
                <h4>+ Crear Torre o Módulo</h4>
                <div class="module-form-grid">
                  <input type="text" [(ngModel)]="newModuleForm.name" placeholder="Nombre (Ej. Torre Norte, Bloque B) *" />
                  <input type="text" [(ngModel)]="newModuleForm.description" placeholder="Descripción opcional" />
                  <button class="btn btn-primary" (click)="onAddModule()" [disabled]="!newModuleForm.name">
                    <i class="pi pi-plus"></i> Crear Torre
                  </button>
                </div>
              </div>

              <!-- Listado de Módulos -->
              <div class="modules-list" *ngIf="(activeBuildingDetail()?.modules?.length ?? 0) > 0">
                <div *ngFor="let m of activeBuildingDetail()?.modules" class="module-item-card">
                  <div class="module-info">
                    <div class="module-icon">
                      <i class="pi pi-th-large"></i>
                    </div>
                    <div>
                      <h5>{{ m.name }}</h5>
                      <p>{{ m.description || 'Sin descripción' }}</p>
                    </div>
                  </div>
                  <div class="module-actions">
                    <button class="btn-remove" (click)="onDeleteModule(m.id)" title="Eliminar torre">
                      <i class="pi pi-trash"></i> Eliminar
                    </button>
                  </div>
                </div>
              </div>

              <div *ngIf="activeBuildingDetail()?.modules?.length === 0" class="empty-tab">
                <p>Este edificio no cuenta con módulos o torres diferenciadas (se considera estructura de núcleo único).</p>
              </div>
            </div>

            <!-- TAB 3: ADMINISTRADORES DE ESTE EDIFICIO -->
            <div *ngIf="activeTab() === 'admins'" class="tab-content">
              <h4>Administradores Asignados a este Edificio</h4>
              <p class="section-hint">Usuarios con rol BUILDING_ADMIN con permisos delegados para gestionar este edificio.</p>

              <div *ngIf="activeBuildingDetail()?.admins?.length === 0" class="empty-tab">
                <p>Este edificio no tiene administradores delegados específicos. Es gestionado directamente por los administradores generales del consorcio.</p>
              </div>

              <div class="table-responsive" *ngIf="(activeBuildingDetail()?.admins?.length ?? 0) > 0">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let adm of activeBuildingDetail()?.admins">
                      <td><strong>{{ adm.user?.fullName }}</strong></td>
                      <td>{{ adm.user?.email }}</td>
                      <td>{{ adm.user?.phone || 'No registrado' }}</td>
                      <td><span class="role-badge-building">BUILDING_ADMIN</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeManageBuilding()">Cerrar</button>
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
      flex-wrap: wrap;
      gap: 1rem;
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
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .consortium-filter {
      padding: 0.5rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.85rem;
      background: #ffffff;
      color: #334155;
      font-weight: 500;
    }
    .consortium-filter:focus {
      outline: none;
      border-color: #0284c7;
    }
    .buildings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .empty-state {
      grid-column: 1 / -1;
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 3rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .empty-icon {
      font-size: 3rem;
      color: #94a3b8;
    }
    .empty-state h3 {
      margin: 0;
      color: #0f172a;
      font-size: 1.25rem;
    }
    .empty-state p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
      max-width: 420px;
    }
    .building-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      overflow: hidden;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .building-card:hover {
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
    .consortium-badge {
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
      gap: 0.75rem;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }
    .metric-pill {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
      background: #f8fafc;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
    }
    .metric-num {
      font-weight: 700;
      font-size: 1rem;
      color: #0284c7;
    }
    .metric-lbl {
      font-size: 0.725rem;
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
    .modal-box.modal-xl {
      max-width: 920px;
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
      display: flex;
      align-items: center;
      gap: 0.35rem;
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
    .modal-tabs {
      display: flex;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 1.5rem;
      gap: 0.5rem;
    }
    .tab-btn {
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      font-size: 0.825rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: #0f172a;
    }
    .tab-btn.active {
      color: #0284c7;
      border-bottom-color: #0284c7;
      background: #ffffff;
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
    .form-group input, .form-group select {
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #0f172a;
      background: #ffffff;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    /* Tabs Content Styles */
    .tab-content {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .quick-add-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .quick-add-card h4 {
      margin: 0;
      font-size: 0.875rem;
      color: #0f172a;
    }
    .unit-form-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 2fr auto;
      gap: 0.65rem;
      align-items: flex-end;
    }
    .input-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .input-wrap label {
      font-size: 0.725rem;
      font-weight: 600;
      color: #64748b;
    }
    .input-wrap input, .input-wrap select {
      padding: 0.45rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.8rem;
      background: #ffffff;
    }
    .table-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-header-row h4 {
      margin: 0;
      font-size: 0.925rem;
      color: #0f172a;
    }
    .filter-select {
      padding: 0.35rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.8rem;
      background: #ffffff;
    }
    .module-form-grid {
      display: grid;
      grid-template-columns: 2fr 3fr auto;
      gap: 0.65rem;
    }
    .module-form-grid input {
      padding: 0.45rem 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .modules-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .module-item-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .module-info {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    .module-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #f1f5f9;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .module-info h5 {
      margin: 0;
      font-size: 0.875rem;
      color: #0f172a;
    }
    .module-info p {
      margin: 0.15rem 0 0 0;
      font-size: 0.75rem;
      color: #64748b;
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
    .module-badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.725rem;
      font-weight: 600;
    }
    .general-badge {
      background: #f1f5f9;
      color: #64748b;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.725rem;
    }
    .occupant-badge {
      background: #dcfce7;
      color: #15803d;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.725rem;
      font-weight: 500;
    }
    .occupant-badge.vacant {
      background: #fef3c7;
      color: #b45309;
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
    .empty-tab, .loading-state {
      padding: 2.5rem;
      text-align: center;
      color: #64748b;
      font-size: 0.875rem;
    }
    .section-hint {
      margin: -0.5rem 0 0 0;
      font-size: 0.8rem;
      color: #64748b;
    }
  `]
})
export class BuildingsComponent implements OnInit {
  private readonly buildingService = inject(BuildingService);
  private readonly consortiumService = inject(ConsortiumService);

  buildings = signal<BuildingDto[]>([]);
  consortiums = signal<ConsortiumDto[]>([]);
  loading = signal<boolean>(true);
  selectedConsortiumFilter: string = '';

  // Modal Crear / Editar Edificio
  showBuildingModal = signal<boolean>(false);
  editingBuildingId = signal<string | null>(null);
  buildingForm: CreateBuildingDto = {
    consortiumId: '',
    name: '',
    address: '',
    city: 'Montevideo',
    country: 'Uruguay',
    timezone: 'America/Montevideo',
  };

  // Modal Gestión Detallada
  activeBuildingDetail = signal<BuildingDetailDto | null>(null);
  activeTab = signal<'units' | 'modules' | 'admins'>('units');

  // Gestión de Unidades
  units = signal<UnitDto[]>([]);
  unitsLoading = signal<boolean>(false);
  unitModuleFilter: string = '';
  newUnitForm: CreateUnitDto = {
    code: '',
    floor: '',
    moduleId: undefined,
  };

  // Gestión de Módulos
  newModuleForm: CreateBuildingModuleDto = {
    name: '',
    description: '',
  };

  ngOnInit() {
    this.loadConsortiums();
    this.loadBuildings();
  }

  loadConsortiums() {
    this.consortiumService.getConsortiums().subscribe({
      next: (data) => this.consortiums.set(data),
    });
  }

  loadBuildings() {
    this.loading.set(true);
    this.buildingService.getBuildings(this.selectedConsortiumFilter || undefined).subscribe({
      next: (data) => {
        this.buildings.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onConsortiumFilterChange() {
    this.loadBuildings();
  }

  // --- Alta / Edición Edificio ---
  openCreateBuildingModal() {
    this.editingBuildingId.set(null);
    this.buildingForm = {
      consortiumId: this.selectedConsortiumFilter || (this.consortiums()[0]?.id ?? ''),
      name: '',
      address: '',
      city: 'Montevideo',
      country: 'Uruguay',
      timezone: 'America/Montevideo',
    };
    this.showBuildingModal.set(true);
  }

  openEditBuildingModal(item: BuildingDto) {
    this.editingBuildingId.set(item.id);
    this.buildingForm = {
      consortiumId: item.consortiumId,
      name: item.name,
      address: item.address,
      city: item.city,
      country: item.country,
      timezone: item.timezone,
    };
    this.showBuildingModal.set(true);
  }

  closeBuildingModal() {
    this.showBuildingModal.set(false);
    this.editingBuildingId.set(null);
  }

  saveBuilding() {
    if (!this.buildingForm.name || !this.buildingForm.address) return;

    if (this.editingBuildingId()) {
      this.buildingService.updateBuilding(this.editingBuildingId()!, this.buildingForm).subscribe({
        next: () => {
          this.closeBuildingModal();
          this.loadBuildings();
        },
      });
    } else {
      this.buildingService.createBuilding(this.buildingForm).subscribe({
        next: () => {
          this.closeBuildingModal();
          this.loadBuildings();
        },
      });
    }
  }

  onDeleteBuilding(item: BuildingDto) {
    if (confirm(`¿Estás seguro de eliminar el edificio "${item.name}"?`)) {
      this.buildingService.deleteBuilding(item.id).subscribe({
        next: () => this.loadBuildings(),
        error: (err) => alert(err.error?.message || 'Error al eliminar edificio'),
      });
    }
  }

  // --- Modal Gestión Detallada ---
  openManageBuilding(item: BuildingDto) {
    this.activeTab.set('units');
    this.loadBuildingDetail(item.id);
  }

  closeManageBuilding() {
    this.activeBuildingDetail.set(null);
    this.units.set([]);
    this.loadBuildings();
  }

  loadBuildingDetail(id: string) {
    this.buildingService.getBuildingById(id).subscribe({
      next: (detail) => {
        this.activeBuildingDetail.set(detail);
        this.loadUnits(id);
      },
    });
  }

  // --- Gestión de Unidades ---
  loadUnits(buildingId: string) {
    this.unitsLoading.set(true);
    this.buildingService.getUnits(buildingId).subscribe({
      next: (data) => {
        this.units.set(data);
        this.unitsLoading.set(false);
      },
      error: () => this.unitsLoading.set(false),
    });
  }

  filteredUnits(): UnitDto[] {
    if (!this.unitModuleFilter) return this.units();
    return this.units().filter((u) => u.moduleId === this.unitModuleFilter);
  }

  onAddUnit() {
    const detail = this.activeBuildingDetail();
    if (!detail || !this.newUnitForm.code) return;

    this.buildingService.createUnit(detail.id, this.newUnitForm).subscribe({
      next: () => {
        this.newUnitForm = { code: '', floor: '', moduleId: undefined };
        this.loadUnits(detail.id);
      },
      error: (err) => alert(err.error?.message || 'Error al agregar unidad'),
    });
  }

  onDeleteUnit(unitId: string) {
    const detail = this.activeBuildingDetail();
    if (!detail) return;

    if (confirm('¿Estás seguro de eliminar esta unidad funcional?')) {
      this.buildingService.deleteUnit(detail.id, unitId).subscribe({
        next: () => this.loadUnits(detail.id),
        error: (err) => alert(err.error?.message || 'Error al eliminar unidad'),
      });
    }
  }

  // --- Gestión de Módulos ---
  onAddModule() {
    const detail = this.activeBuildingDetail();
    if (!detail || !this.newModuleForm.name) return;

    this.buildingService.createModule(detail.id, this.newModuleForm).subscribe({
      next: () => {
        this.newModuleForm = { name: '', description: '' };
        this.loadBuildingDetail(detail.id);
      },
      error: (err) => alert(err.error?.message || 'Error al crear módulo'),
    });
  }

  onDeleteModule(moduleId: string) {
    const detail = this.activeBuildingDetail();
    if (!detail) return;

    if (confirm('¿Estás seguro de eliminar esta torre/módulo?')) {
      this.buildingService.deleteModule(detail.id, moduleId).subscribe({
        next: () => this.loadBuildingDetail(detail.id),
        error: (err) => alert(err.error?.message || 'Error al eliminar módulo'),
      });
    }
  }
}
