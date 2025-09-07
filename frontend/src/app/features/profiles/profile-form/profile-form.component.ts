import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzGridModule } from 'ng-zorro-antd/grid';

import { NgSelectModule } from '@ng-select/ng-select';

import { Profile } from '../../../core/models/profile';
import { ProfileService } from '../../../core/services/profile.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FbrLookupService } from '../../../core/services/fbr-lookup.service';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzSwitchModule,
    NzGridModule,
    NgSelectModule
  ],
  template: `
    <div class="profile-form-container">
      <nz-card [nzBordered]="false">
        <div class="header-section">
          <h2>{{ isEditMode ? 'Edit Profile' : 'Create New Profile' }}</h2>
          <button nz-button nzType="default" (click)="goBack()">
            Back to Profiles
          </button>
        </div>

        <nz-spin [nzSpinning]="loading">
          <form nz-form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <div nz-row [nzGutter]="16">
              <div nz-col nzSpan="12">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">Profile Name</nz-form-label>
                  <nz-form-control nzErrorTip="Please enter a profile name">
                    <input 
                      nz-input 
                      formControlName="name" 
                      placeholder="e.g., Main Business, Branch Office"
                    />
                  </nz-form-control>
                </nz-form-item>
              </div>

              <div nz-col nzSpan="12">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">NTN/CNIC</nz-form-label>
                  <nz-form-control nzErrorTip="Please enter NTN/CNIC">
                    <input 
                      nz-input 
                      formControlName="ntncnic" 
                      placeholder="Enter NTN or CNIC number"
                    />
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <div nz-row [nzGutter]="16">
              <div nz-col nzSpan="24">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">Business Name</nz-form-label>
                  <nz-form-control nzErrorTip="Please enter business name">
                    <input 
                      nz-input 
                      formControlName="businessName" 
                      placeholder="Enter business name"
                    />
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <div nz-row [nzGutter]="16">
              <div nz-col nzSpan="12">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">Province</nz-form-label>
                  <nz-form-control nzErrorTip="Please select a province">
                    <ng-select
                      formControlName="province"
                      placeholder="Select province"
                      [searchable]="true"
                      bindLabel="description"
                      bindValue="description"
                      [loading]="loadingProvinces">
                      <ng-option 
                        *ngFor="let province of provinceOptions" 
                        [value]="province.description">
                        {{ province.description }}
                      </ng-option>
                    </ng-select>
                  </nz-form-control>
                </nz-form-item>
              </div>

              <div nz-col nzSpan="12">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">Registration Type</nz-form-label>
                  <nz-form-control nzErrorTip="Please select registration type">
                    <ng-select
                      formControlName="registrationType"
                      placeholder="Select registration type"
                      [items]="['Registered', 'Unregistered']"
                      [searchable]="false">
                    </ng-select>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <div nz-row>
              <div nz-col nzSpan="24">
                <nz-form-item>
                  <nz-form-label [nzRequired]="true">Address</nz-form-label>
                  <nz-form-control nzErrorTip="Please enter address">
                    <textarea 
                      nz-input 
                      formControlName="address" 
                      rows="3"
                      placeholder="Enter complete address"
                    ></textarea>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <div nz-row>
              <div nz-col nzSpan="24">
                <nz-form-item>
                  <nz-form-label>Set as Default Profile</nz-form-label>
                  <nz-form-control>
                    <nz-switch 
                      formControlName="isDefault"
                      nzCheckedChildren="Yes" 
                      nzUnCheckedChildren="No">
                    </nz-switch>
                    <div class="switch-help">
                      Default profile will be pre-selected in invoice forms
                    </div>
                  </nz-form-control>
                </nz-form-item>
              </div>
            </div>

            <div class="form-actions">
              <button nz-button nzType="default" (click)="goBack()">
                Cancel
              </button>
              <button 
                nz-button 
                nzType="primary" 
                [nzLoading]="saving"
                [disabled]="!profileForm.valid || saving">
                {{ saving ? 'Saving...' : (isEditMode ? 'Update Profile' : 'Create Profile') }}
              </button>
            </div>
          </form>
        </nz-spin>
      </nz-card>
    </div>
  `,
  styles: [`
    .profile-form-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
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

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #f0f0f0;
    }

    .switch-help {
      font-size: 12px;
      color: #8c8c8c;
      margin-top: 4px;
    }

    :host ::ng-deep .ng-select.ng-select-single .ng-select-container {
      height: 32px;
      min-height: 32px;
    }

    :host ::ng-deep .ng-select .ng-select-container {
      border-color: #d9d9d9;
      border-radius: 6px;
    }

    :host ::ng-deep .ng-select.ng-select-focused .ng-select-container {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  `]
})
export class ProfileFormComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  saving = false;
  isEditMode = false;
  profileId: number | null = null;
  loadingProvinces = false;

  provinceOptions: { code: number; description: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private profileService: ProfileService,
    private notificationService: NotificationService,
    private fbr: FbrLookupService
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadProvinces();
    
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.profileId = +params['id'];
        this.loadProfile();
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      ntncnic: ['', Validators.required],
      businessName: ['', Validators.required],
      province: ['', Validators.required],
      address: ['', Validators.required],
      registrationType: ['', Validators.required],
      isDefault: [false]
    });
  }

  loadProvinces(): void {
    this.loadingProvinces = true;
    this.fbr.getProvinces().subscribe({
      next: (provinces) => {
        this.provinceOptions = provinces;
        this.loadingProvinces = false;
      },
      error: (error) => {
        console.error('Error loading provinces:', error);
        this.loadingProvinces = false;
      }
    });
  }

  loadProfile(): void {
    if (!this.profileId) return;

    this.loading = true;
    this.profileService.getProfileById(this.profileId).subscribe({
      next: (response) => {
        this.profileForm.patchValue(response.data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.notificationService.error('Error', 'Failed to load profile');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.saving = true;
      const profileData: Profile = this.profileForm.value;

      const operation = this.isEditMode
        ? this.profileService.updateProfile(this.profileId!, profileData)
        : this.profileService.createProfile(profileData);

      operation.subscribe({
        next: (response) => {
          this.saving = false;
          const message = this.isEditMode 
            ? 'Profile updated successfully' 
            : 'Profile created successfully';
          this.notificationService.success('Success', message);
          this.router.navigate(['/profiles']);
        },
        error: (error) => {
          console.error('Error saving profile:', error);
          this.notificationService.error('Error', 'Failed to save profile');
          this.saving = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/profiles']);
  }
}
