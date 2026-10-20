import { Routes } from '@angular/router';
import { authGuard, superAdminGuard, condoOrBuildingAdminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'consortiums',
    canActivate: [superAdminGuard],
    loadComponent: () =>
      import('./pages/consortiums/consortiums.component').then(
        (m) => m.ConsortiumsComponent,
      ),
  },
  {
    path: 'buildings',
    canActivate: [condoOrBuildingAdminGuard],
    loadComponent: () =>
      import('./pages/buildings/buildings.component').then(
        (m) => m.BuildingsComponent,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'reservations',
    canActivate: [condoOrBuildingAdminGuard],
    loadComponent: () =>
      import('./pages/reservations/reservations.component').then(
        (m) => m.ReservationsComponent,
      ),
  },
  {
    path: 'amenities',
    canActivate: [condoOrBuildingAdminGuard],
    loadComponent: () =>
      import('./pages/amenities/amenities.component').then(
        (m) => m.AmenitiesComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
