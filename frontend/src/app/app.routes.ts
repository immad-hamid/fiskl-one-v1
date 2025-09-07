import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'invoices',
    loadChildren: () =>
      import('./features/invoices/invoices.routes').then(
        (m) => m.INVOICE_ROUTES
      ),
    canActivate: [authGuard],
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/reports/reports.component').then(
        (m) => m.ReportsComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profiles',
    loadChildren: () =>
      import('./features/profiles/profiles.routes').then(
        (m) => m.profileRoutes
      ),
    canActivate: [authGuard],
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent
      ),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/dashboard' },
];
