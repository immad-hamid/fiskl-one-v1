import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile-list/profile-list.component').then(m => m.ProfileListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./profile-form/profile-form.component').then(m => m.ProfileFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./profile-form/profile-form.component').then(m => m.ProfileFormComponent)
  }
];
