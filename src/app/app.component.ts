import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuildingService } from './core/services/building.service';
import { AuthService } from './core/services/auth.service';
import { UserRole } from '@core/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Si no está autenticado o está en login, renderizar outlet directo sin marco de layout -->
    <div *ngIf="!authService.isAuthenticated() || isLoginPage()" class="full-screen-wrap">
      <router-outlet></router-outlet>
    </div>

    <!-- Layout autenticado -->
    <div *ngIf="authService.isAuthenticated() && !isLoginPage()" class="layout-container">
      <!-- Sidebar -->
      <aside class="layout-sidebar">
        <div class="sidebar-brand">
          <i class="pi pi-building brand-icon"></i>
          <span class="brand-title">MiEdificio</span>
        </div>

        <nav class="sidebar-menu">
          <!-- Menú SuperAdmin -->
          <ng-container *ngIf="authService.isSuperAdmin()">
            <a routerLink="/consortiums" routerLinkActive="active" class="menu-item">
              <i class="pi pi-briefcase"></i>
              <span>Consorcios</span>
            </a>
            <a routerLink="/dashboard" routerLinkActive="active" class="menu-item">
              <i class="pi pi-chart-bar"></i>
              <span>Dashboard Global</span>
            </a>
          </ng-container>

          <!-- Menú Administrador de Consorcio / Edificio -->
          <ng-container *ngIf="!authService.isSuperAdmin()">
            <a routerLink="/dashboard" routerLinkActive="active" class="menu-item">
              <i class="pi pi-home"></i>
              <span>Dashboard</span>
            </a>
            <a routerLink="/buildings" routerLinkActive="active" class="menu-item">
              <i class="pi pi-building"></i>
              <span>Edificios & Unidades</span>
            </a>
            <a routerLink="/reservations" routerLinkActive="active" class="menu-item">
              <i class="pi pi-calendar"></i>
              <span>Gestión de Reservas</span>
            </a>
            <a routerLink="/amenities" routerLinkActive="active" class="menu-item">
              <i class="pi pi-calendar-plus"></i>
              <span>Amenities & Salones</span>
            </a>
          </ng-container>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <div class="layout-content">
        <header class="layout-header">
          <div class="header-left">
            <span class="context-scope" *ngIf="authService.isSuperAdmin()">
              👑 <strong>Panel de Plataforma</strong> &bull; SuperAdmin
            </span>
            <span class="context-scope" *ngIf="authService.isCondoAdmin()">
              🏢 <strong>{{ currentUser()?.consortium?.name || 'Mi Consorcio' }}</strong> &bull; Admin General
            </span>
            <span class="context-scope" *ngIf="authService.isBuildingAdmin()">
              🏢 <strong>{{ currentBuildingScope() }}</strong> &bull; Admin Delegado
            </span>
          </div>

          <div class="header-right">
            <!-- Selector rápido de dev users -->
            <div class="dev-switch-wrap" *ngIf="devUsers().length > 0">
              <label class="dev-switch-label">
                <i class="pi pi-sync"></i> Cambiar usuario:
              </label>
              <select class="dev-select" (change)="onSwitchUser($event)">
                <option 
                  *ngFor="let u of devUsers()" 
                  [value]="u.email" 
                  [selected]="u.email === currentUser()?.email"
                >
                  {{ u.fullName }} ({{ getRoleShort(u.role) }})
                </option>
              </select>
            </div>

            <div class="header-divider" *ngIf="devUsers().length > 0"></div>

            <!-- Perfil actual -->
            <div class="user-pill">
              <div class="user-avatar">
                <i class="pi pi-user"></i>
              </div>
              <div class="user-info">
                <span class="user-name">{{ currentUser()?.fullName }}</span>
                <span [class]="getRoleBadgeClass(currentUser()?.role)">
                  {{ getRoleLabel(currentUser()?.role) }}
                </span>
              </div>
            </div>

            <!-- Botón Salir -->
            <button class="btn-logout" (click)="onLogout()" title="Desconectar / Cerrar sesión">
              <i class="pi pi-sign-out"></i>
              <span class="logout-text">Desconectar</span>
            </button>
          </div>
        </header>

        <main class="layout-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .full-screen-wrap {
      min-height: 100vh;
      width: 100vw;
    }
    .sidebar-brand {
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      gap: 0.75rem;
    }
    .brand-icon {
      font-size: 1.5rem;
      color: #38bdf8;
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .sidebar-menu {
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .menu-item:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: #ffffff;
    }
    .menu-item.active {
      background-color: #0284c7;
      color: #ffffff;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-shrink: 0;
    }
    .header-divider {
      width: 1px;
      height: 24px;
      background-color: #e2e8f0;
    }
    .context-scope {
      font-size: 0.875rem;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .context-scope strong {
      color: #0f172a;
    }
    .dev-switch-wrap {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: #f8fafc;
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .dev-switch-label {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .dev-select {
      padding: 0.3rem 0.6rem;
      font-size: 0.775rem;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #ffffff;
      color: #0369a1;
      font-weight: 600;
      cursor: pointer;
    }
    .dev-select:focus {
      outline: none;
      border-color: #0284c7;
    }
    .user-pill {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #ffffff;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    .user-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }
    .user-name {
      font-size: 0.825rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
    }
    .badge-superadmin {
      background: #fef3c7;
      color: #b45309;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      white-space: nowrap;
    }
    .badge-condo {
      background: #f3e8ff;
      color: #7e22ce;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      white-space: nowrap;
    }
    .badge-building {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      white-space: nowrap;
    }
    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.75rem;
      background: #ffffff;
      border: 1px solid #fee2e2;
      border-radius: 6px;
      color: #ef4444;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-logout:hover {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fca5a5;
    }
    .logout-text {
      font-size: 0.8rem;
    }
  `]
})
export class AppComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly buildingService = inject(BuildingService);
  private readonly router = inject(Router);

  devUsers = signal<any[]>([]);

  currentUser = this.authService.currentUser;

  ngOnInit() {
    this.buildingService.getBuildings().subscribe();
    this.loadDevUsers();
  }

  loadDevUsers() {
    this.authService.getDevUsers().subscribe({
      next: (users) => this.devUsers.set(users),
    });
  }

  isLoginPage(): boolean {
    return this.router.url.includes('/login');
  }

  onSwitchUser(event: any) {
    const email = event.target.value;
    if (!email) return;

    this.authService.loginAs({ email }).subscribe({
      next: (user) => {
        if (user.role === UserRole.SUPER_ADMIN) {
          this.router.navigate(['/consortiums']);
        } else {
          this.router.navigate(['/buildings']);
        }
      },
    });
  }

  onLogout() {
    this.authService.logout();
  }

  currentBuildingScope(): string {
    const user = this.currentUser();
    if (user?.administeredBuildings && user.administeredBuildings.length > 0) {
      return user.administeredBuildings.map((b) => b.name).join(', ');
    }
    return user?.consortium?.name || 'Edificio asignado';
  }

  getRoleLabel(role?: string): string {
    if (role === UserRole.SUPER_ADMIN) return 'SuperAdmin';
    if (role === UserRole.CONDOMINIUM_ADMIN) return 'Admin Consorcio';
    if (role === UserRole.BUILDING_ADMIN) return 'Admin Edificio';
    return role || '';
  }

  getRoleBadgeClass(role?: string): string {
    if (role === UserRole.SUPER_ADMIN) return 'badge-superadmin';
    if (role === UserRole.CONDOMINIUM_ADMIN) return 'badge-condo';
    return 'badge-building';
  }

  getRoleShort(role?: string): string {
    if (role === UserRole.SUPER_ADMIN) return 'SuperAdmin';
    if (role === UserRole.CONDOMINIUM_ADMIN) return 'Consorcio';
    if (role === UserRole.BUILDING_ADMIN) return 'Edificio';
    return '';
  }
}
