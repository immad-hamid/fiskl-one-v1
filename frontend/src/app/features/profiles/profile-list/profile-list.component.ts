import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { Profile } from '../../../core/models/profile';
import { ProfileService } from '../../../core/services/profile.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-profile-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzTagModule,
    NzPopconfirmModule,
    NzSpinModule,
    NzToolTipModule
  ],
  template: `
    <div class="profile-list-container">
      <nz-card [nzBordered]="false">
        <div class="header-section">
          <h2>Business Profiles</h2>
          <button nz-button nzType="primary" [routerLink]="['/profiles/new']">
            <i nz-icon nzType="plus" nzTheme="outline"></i>
            Add New Profile
          </button>
        </div>

        <nz-spin [nzSpinning]="loading">
          <nz-table #basicTable [nzData]="profiles" [nzPageSize]="10">
            <thead>
              <tr>
                <th>Profile Name</th>
                <th>Business Name</th>
                <th>NTN/CNIC</th>
                <th>Province</th>
                <th>Registration Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let profile of basicTable.data">
                <td>
                  <strong>{{ profile.name }}</strong>
                </td>
                <td>{{ profile.businessName }}</td>
                <td>{{ profile.ntncnic }}</td>
                <td>{{ profile.province }}</td>
                <td>{{ profile.registrationType }}</td>
                <td>
                  <nz-tag [nzColor]="profile.isDefault ? 'green' : 'default'">
                    {{ profile.isDefault ? 'Default' : 'Active' }}
                  </nz-tag>
                </td>
                <td class="action-buttons">
                  <button 
                    nz-button 
                    nzType="default" 
                    nzSize="small"
                    [routerLink]="['/profiles/edit', profile.id]"
                    nz-tooltip="Edit Profile">
                    <i nz-icon nzType="edit" nzTheme="outline"></i>
                  </button>
                  
                  <button 
                    *ngIf="!profile.isDefault"
                    nz-button 
                    nzType="default" 
                    nzSize="small"
                    (click)="setDefault(profile.id!)"
                    nz-tooltip="Set as Default">
                    <i nz-icon nzType="star" nzTheme="outline"></i>
                  </button>
                  
                  <button 
                    nz-button 
                    nzType="default" 
                    nzDanger 
                    nzSize="small"
                    nz-popconfirm
                    nzPopconfirmTitle="Are you sure you want to delete this profile?"
                    (nzOnConfirm)="deleteProfile(profile.id!)"
                    nz-tooltip="Delete Profile">
                    <i nz-icon nzType="delete" nzTheme="outline"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </nz-table>
        </nz-spin>

        <div *ngIf="!loading && profiles.length === 0" class="empty-state">
          <div class="empty-content">
            <i nz-icon nzType="user" nzTheme="outline" style="font-size: 48px; color: #bfbfbf;"></i>
            <h3>No Profiles Found</h3>
            <p>Create your first business profile to get started.</p>
            <button nz-button nzType="primary" [routerLink]="['/profiles/new']">
              Create Profile
            </button>
          </div>
        </div>
      </nz-card>
    </div>
  `,
  styles: [`
    .profile-list-container {
      padding: 24px;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-section h2 {
      margin: 0;
      color: #262626;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-content i {
      display: block;
      margin-bottom: 16px;
    }

    .empty-content h3 {
      margin-bottom: 8px;
      color: #262626;
    }

    .empty-content p {
      color: #8c8c8c;
      margin-bottom: 24px;
    }

    :host ::ng-deep .ant-table-tbody > tr > td {
      padding: 12px 16px;
    }

    :host ::ng-deep .ant-tag {
      margin: 0;
    }
  `]
})
export class ProfileListComponent implements OnInit {
  profiles: Profile[] = [];
  loading = false;

  constructor(
    private profileService: ProfileService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProfiles();
  }

  loadProfiles(): void {
    this.loading = true;
    this.profileService.getProfiles().subscribe({
      next: (response) => {
        this.profiles = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profiles:', error);
        this.notificationService.error('Error', 'Failed to load profiles');
        this.loading = false;
      }
    });
  }

  setDefault(profileId: number): void {
    this.profileService.setDefaultProfile(profileId).subscribe({
      next: (response) => {
        this.notificationService.success('Success', 'Default profile updated');
        this.loadProfiles(); // Refresh the list
      },
      error: (error) => {
        console.error('Error setting default profile:', error);
        this.notificationService.error('Error', 'Failed to set default profile');
      }
    });
  }

  deleteProfile(profileId: number): void {
    this.profileService.deleteProfile(profileId).subscribe({
      next: (response) => {
        this.notificationService.success('Success', 'Profile deleted successfully');
        this.loadProfiles(); // Refresh the list
      },
      error: (error) => {
        console.error('Error deleting profile:', error);
        this.notificationService.error('Error', 'Failed to delete profile');
      }
    });
  }
}
