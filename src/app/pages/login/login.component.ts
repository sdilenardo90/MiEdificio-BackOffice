import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserDto, UserRole } from '@core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-container">
        <!-- Logo & Brand -->
        <div class="brand-section">
          <div class="brand-icon-wrap">
            <i class="pi pi-building"></i>
          </div>
          <h1>MiEdificio</h1>
          <p class="brand-sub">Plataforma de Gestión Integral de Consorcios y Propiedad Horizontal</p>
        </div>

        <!-- Dev Bypass Notice -->
        <div class="dev-banner">
          <i class="pi pi-shield"></i>
          <div>
            <strong>Modo Desarrollo (Bypass de Autenticación)</strong>
            <p>Selecciona una identidad para simular el acceso según su nivel administrativo.</p>
          </div>
        </div>

        <!-- Acceso Principal SuperAdmin -->
        <div class="primary-bypass">
          <button class="btn-superadmin" (click)="loginAsSuperAdmin()" [disabled]="loading()">
            <i class="pi pi-bolt"></i>
            <div class="btn-text">
              <span class="main-title">Ingresar como SuperAdmin</span>
              <span class="sub-title">Dueño de la plataforma &bull; Administra consorcios y administradores</span>
            </div>
            <i class="pi pi-arrow-right arrow-icon"></i>
          </button>
        </div>

        <!-- Cuentas de Prueba Creadas -->
        <div class="dev-accounts-section">
          <h3>O ingresar como Administrador de Consorcio / Edificio:</h3>
          
          <div *ngIf="loadingDevUsers()" class="loading-users">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Cargando cuentas disponibles...</span>
          </div>

          <div *ngIf="!loadingDevUsers() && adminUsers().length === 0" class="no-admins-note">
            <p>Aún no hay administradores de consorcio creados. Ingresa primero como SuperAdmin para darlos de alta.</p>
          </div>

          <div class="accounts-grid" *ngIf="!loadingDevUsers() && adminUsers().length > 0">
            <div 
              *ngFor="let user of adminUsers()" 
              class="account-card" 
              (click)="loginAsUser(user)"
            >
              <div class="account-avatar">
                <i [class]="user.role === 'CONDOMINIUM_ADMIN' ? 'pi pi-briefcase' : 'pi pi-home'"></i>
              </div>
              <div class="account-info">
                <h4>{{ user.fullName }}</h4>
                <span class="account-email">{{ user.email }}</span>
                <div class="account-scope">
                  <span [class]="user.role === 'CONDOMINIUM_ADMIN' ? 'badge-condo' : 'badge-building'">
                    {{ user.role === 'CONDOMINIUM_ADMIN' ? 'Admin Consorcio' : 'Admin Edificio' }}
                  </span>
                  <span class="scope-name" *ngIf="user.consortium?.name">
                    {{ user.consortium?.name }}
                  </span>
                </div>
              </div>
              <i class="pi pi-chevron-right enter-icon"></i>
            </div>
          </div>
        </div>

        <!-- Ingreso manual por email -->
        <div class="manual-email-section">
          <label>Ingresar con cualquier email registrado:</label>
          <div class="email-input-row">
            <input type="email" [(ngModel)]="customEmail" placeholder="usuario@ejemplo.com" (keyup.enter)="loginWithCustomEmail()" />
            <button class="btn btn-secondary" (click)="loginWithCustomEmail()" [disabled]="!customEmail || loading()">
              Ingresar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 2rem;
    }
    .login-container {
      background: #ffffff;
      width: 100%;
      max-width: 580px;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .brand-section {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .brand-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: #e0f2fe;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
    }
    .brand-section h1 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
    }
    .brand-sub {
      margin: 0;
      font-size: 0.85rem;
      color: #64748b;
      max-width: 360px;
    }
    .dev-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 0.85rem 1rem;
      display: flex;
      gap: 0.75rem;
      align-items: center;
      color: #166534;
      font-size: 0.8rem;
    }
    .dev-banner i {
      font-size: 1.25rem;
      color: #22c55e;
      flex-shrink: 0;
    }
    .dev-banner p {
      margin: 0.15rem 0 0 0;
      color: #15803d;
    }
    .btn-superadmin {
      width: 100%;
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      border: none;
      border-radius: 12px;
      padding: 1.15rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
      transition: all 0.2s ease;
      text-align: left;
    }
    .btn-superadmin:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(2, 132, 199, 0.45);
      background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
    }
    .btn-superadmin > i:first-child {
      font-size: 1.75rem;
      color: #fef08a;
      flex-shrink: 0;
    }
    .btn-text {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .main-title {
      font-size: 1.05rem;
      font-weight: 700;
    }
    .sub-title {
      font-size: 0.75rem;
      color: #e0f2fe;
      margin-top: 0.15rem;
    }
    .arrow-icon {
      font-size: 1.1rem;
      color: #bae6fd;
    }
    .dev-accounts-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .dev-accounts-section h3 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
    }
    .accounts-grid {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 220px;
      overflow-y: auto;
    }
    .account-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .account-card:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      transform: translateX(4px);
    }
    .account-avatar {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0284c7;
      font-size: 1.15rem;
      flex-shrink: 0;
    }
    .account-info {
      flex: 1;
      min-width: 0;
    }
    .account-info h4 {
      margin: 0;
      font-size: 0.875rem;
      color: #0f172a;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .account-email {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
    }
    .account-scope {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .badge-condo {
      background: #f3e8ff;
      color: #7e22ce;
      font-size: 0.675rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .badge-building {
      background: #e0f2fe;
      color: #0369a1;
      font-size: 0.675rem;
      font-weight: 600;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .scope-name {
      font-size: 0.725rem;
      color: #475569;
      font-weight: 500;
    }
    .enter-icon {
      color: #94a3b8;
      font-size: 0.85rem;
    }
    .manual-email-section {
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .manual-email-section label {
      font-size: 0.775rem;
      color: #64748b;
      font-weight: 500;
    }
    .email-input-row {
      display: flex;
      gap: 0.5rem;
    }
    .email-input-row input {
      flex: 1;
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .email-input-row input:focus {
      outline: none;
      border-color: #0284c7;
    }
    .btn {
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
    }
    .btn-secondary {
      background: #0f172a;
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: #1e293b;
    }
    .loading-users, .no-admins-note {
      padding: 1rem;
      text-align: center;
      font-size: 0.8rem;
      color: #64748b;
      background: #f8fafc;
      border-radius: 8px;
    }
  `]
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal<boolean>(false);
  loadingDevUsers = signal<boolean>(true);
  devUsers = signal<any[]>([]);
  adminUsers = signal<any[]>([]);
  customEmail: string = '';

  ngOnInit() {
    this.loadDevUsers();
  }

  loadDevUsers() {
    this.loadingDevUsers.set(true);
    this.authService.getDevUsers().subscribe({
      next: (users) => {
        this.devUsers.set(users);
        // Filtrar solo los que no son SUPER_ADMIN para la lista secundaria
        this.adminUsers.set(users.filter((u) => u.role !== UserRole.SUPER_ADMIN));
        this.loadingDevUsers.set(false);
      },
      error: () => this.loadingDevUsers.set(false),
    });
  }

  loginAsSuperAdmin() {
    this.loading.set(true);
    this.authService.loginAs({ role: UserRole.SUPER_ADMIN }).subscribe({
      next: () => {
        this.router.navigate(['/consortiums']);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.message || 'Error al iniciar sesión como SuperAdmin');
      },
    });
  }

  loginAsUser(user: any) {
    this.loading.set(true);
    this.authService.loginAs({ email: user.email }).subscribe({
      next: () => {
        // Si es admin de consorcio o edificio, dirigir a edificios o dashboard
        this.router.navigate(['/buildings']);
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.message || 'Error al iniciar sesión');
      },
    });
  }

  loginWithCustomEmail() {
    if (!this.customEmail) return;
    this.loading.set(true);
    this.authService.loginAs({ email: this.customEmail }).subscribe({
      next: (user) => {
        if (user.role === UserRole.SUPER_ADMIN) {
          this.router.navigate(['/consortiums']);
        } else {
          this.router.navigate(['/buildings']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.message || 'Usuario no encontrado');
      },
    });
  }
}
