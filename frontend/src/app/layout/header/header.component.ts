import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    NzButtonModule,
    NzDropDownModule,
    NzAvatarModule,
    NzMenuModule,
    NzToolTipModule,
    NzBadgeModule
  ],
  template: `
    <div class="header-container">
      <div class="header-left">
        <button 
          nz-button 
          nzType="text" 
          nzSize="large"
          (click)="toggleCollapsed.emit()"
          nz-tooltip
          [nzTooltipTitle]="isCollapsed ? 'Expand Menu' : 'Collapse Menu'">
          <span nz-icon [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'"></span>
        </button>
        
        <div class="breadcrumb">
          <span class="route-title">{{ getRouteTitle() }}</span>
        </div>
      </div>

      <div class="header-right">
        <button 
          nz-button 
          nzType="text" 
          nzSize="large"
          nz-tooltip
          nzTooltipTitle="Refresh Page"
          (click)="refreshPage()">
          <span nz-icon nzType="reload"></span>
        </button>

        <button 
          nz-button 
          nzType="text" 
          nzSize="large"
          nz-tooltip
          [nzTooltipTitle]="isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          (click)="toggleTheme()">
          <span nz-icon [nzType]="isDarkTheme ? 'sun' : 'moon'"></span>
        </button>

        <!-- Notification icon hidden per user request -->
        <!-- <nz-badge [nzCount]="3" nzSize="small">
          <button 
            nz-button 
            nzType="text" 
            nzSize="large"
            nz-tooltip
            nzTooltipTitle="Notifications">
            <span nz-icon nzType="bell"></span>
          </button>
        </nz-badge> -->

        <div class="user-menu" nz-dropdown [nzDropdownMenu]="menu" nzPlacement="bottomRight">
          <nz-avatar nzSize="small" [nzText]="getCurrentUserInitials()"></nz-avatar>
          <span class="username">{{ getCurrentUserDisplayName() }}</span>
          <span nz-icon nzType="down"></span>
        </div>

        <nz-dropdown-menu #menu="nzDropdownMenu">
          <ul nz-menu>
            <li nz-menu-item (click)="navigateToSettings()">
              <span nz-icon nzType="setting"></span>
              Settings
            </li>
            <li nz-menu-divider></li>
            <li nz-menu-item (click)="toggleTheme()">
              <span nz-icon [nzType]="isDarkTheme ? 'sun' : 'moon'"></span>
            </li>
            <li nz-menu-divider></li>
            <li nz-menu-item (click)="logout()">
              <span nz-icon nzType="logout"></span>
              Logout
            </li>
          </ul>
        </nz-dropdown-menu>
      </div>
    </div>
  `,
  styles: [`
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: var(--fiskl-header-height);
      padding: 0 var(--fiskl-spacing-lg);
      background: var(--fiskl-bg-primary);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--fiskl-spacing-md);
    }

    .breadcrumb {
      font-size: var(--fiskl-font-size-base);
      font-weight: var(--fiskl-font-weight-medium);
      color: var(--fiskl-text-primary);
    }

    .route-title {
      text-transform: capitalize;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--fiskl-spacing-md);
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: var(--fiskl-spacing-sm);
      padding: var(--fiskl-spacing-sm) var(--fiskl-spacing-md);
      border-radius: var(--fiskl-radius-md);
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .user-menu:hover {
      background-color: var(--fiskl-bg-secondary);
    }

    .username {
      font-size: var(--fiskl-font-size-sm);
      color: var(--fiskl-text-secondary);
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() isCollapsed = false;
  @Output() toggleCollapsed = new EventEmitter<void>();

  currentUser: User | null = null;
  isDarkTheme = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    // Subscribe to theme changes
    this.subscriptions.add(
      this.themeService.currentTheme$.subscribe(theme => {
        this.isDarkTheme = theme === 'dark';
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  getRouteTitle(): string {
    const route = this.router.url.split('/')[1] || 'dashboard';
    return route.replace('-', ' ');
  }

  refreshPage(): void {
    window.location.reload();
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  toggleTheme(): void {
    console.log('Theme toggle clicked, current theme:', this.themeService.getCurrentTheme());
    this.themeService.toggleTheme();
    console.log('New theme after toggle:', this.themeService.getCurrentTheme());
  }

  getCurrentUserInitials(): string {
    if (!this.currentUser?.email) return 'U';
    return this.currentUser.email.charAt(0).toUpperCase();
  }

  getCurrentUserDisplayName(): string {
    if (!this.currentUser?.email) return 'User';
    // Extract name part from email (before @)
    const emailName = this.currentUser.email.split('@')[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return emailName
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if logout fails, clear local session and redirect
        this.router.navigate(['/login']);
      }
    });
  }
}
