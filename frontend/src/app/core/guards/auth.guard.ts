import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = (route, state): Observable<boolean> | boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is already logged in based on current state
  if (authService.isLoggedIn()) {
    return true;
  }

  // If no token, redirect to login
  const token = authService.getToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  // Verify the token with the server
  return authService.verifySession().pipe(
    take(1),
    map(response => {
      if (response.success) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};