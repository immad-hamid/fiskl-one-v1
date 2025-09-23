import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
// recompute chain when sellerProvinceCode changes (origination supplier)import { ActivatedRoute, Router } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { NgSelectModule } from '@ng-select/ng-select';

import { Invoice } from '../../../core/models/invoice';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FbrLookupService } from '../../../core/services/fbr-lookup.service';
import { ProfileService } from '../../../core/services/profile.service';
import { Profile } from '../../../core/models/profile';
import { Subscription, combineLatest, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { scenarioTypes } from '../../../constants/constants';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzTableModule,
    NzInputNumberModule,
    NzSpinModule,
    NzDividerModule,
    NzPopconfirmModule,
    NzToolTipModule,
    NgSelectModule,
  ],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.scss'],
})
export class InvoiceFormComponent implements OnInit, OnDestroy {
  invoiceForm: FormGroup;
  loading = false;
  saving = false;
  isEditMode = false;
  invoiceId: number | null = null;

  // dropdown data
  provinceOptions: { code: number; description: string }[] = [];
  hsCodeOptions: { hsCode: string; description: string }[] = [];
  filteredHsCodeOptions: { hsCode: string; description: string }[] = [];
  uomOptions: { id: number; name: string }[] = [];
  saleTypeOptions: { id: number; description: string }[] = [];
  profiles: Profile[] = [];
  
  // Rate and SRO dropdown options - each item can have different rates/schedules/items
  rateOptionsMap: Map<number, { id: number; description: string; value: number }[]> = new Map();
  sroScheduleOptionsMap: Map<number, { id: number; description: string }[]> = new Map();
  sroItemOptionsMap: Map<number, { id: number; description: string }[]> = new Map();

  // Loading states for each cascade step per item
  rateLoadingMap: Map<number, boolean> = new Map();
  sroScheduleLoadingMap: Map<number, boolean> = new Map();
  sroItemLoadingMap: Map<number, boolean> = new Map();

  tax236GOptions = [
    {
      name: '0.1%',
      value: 0.1
    },
    {
      name: '2%',
      value: 2
    },
  ];
  tax236HOptions = [
    {
      name: '0.5%',
      value: 0.5
    },
    {
      name: '2.5%',
      value: 2.5
    },
  ]

  private subs = new Subscription();
  private hsCodeSearchSubject = new Subject<string>();

  scenarioTypes: {
    id: string;
    desc: string;
    saleType: string;
    active: boolean;
  }[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private notificationService: NotificationService,
    private fbr: FbrLookupService,
    private profileService: ProfileService
  ) {
    this.invoiceForm = this.createForm();
  }

  ngOnInit(): void {
    this.scenarioTypes = scenarioTypes;
    // load lookup data
    const s1 = this.fbr
      .getProvinces()
      .subscribe({
        next: (v) => (this.provinceOptions = v),
        error: (error) => this.handleFbrLookupError('provinces', error)
      });
    const s2 = this.fbr.getHsCodes().subscribe({
      next: (v) => {
        this.hsCodeOptions = v;
        // Initialize with first 50 items for better performance
        this.filteredHsCodeOptions = v.slice(0, 50);
      },
      error: (error) => this.handleFbrLookupError('HS codes', error)
    });
    const s3 = this.fbr.getUoms().subscribe({
      next: (v) => (this.uomOptions = v),
      error: (error) => this.handleFbrLookupError('units of measure', error)
    });
    const s4 = this.fbr
      .getTransactionTypes()
      .subscribe({
        next: (v) => (this.saleTypeOptions = v),
        error: (error) => this.handleFbrLookupError('transaction types', error)
      });
    const s5 = this.profileService
      .getProfiles()
      .subscribe({
        next: (response) => (this.profiles = response.data),
        error: (error) => {
          console.error('Error loading profiles:', error);
          this.notificationService.error(
            'Error Loading Profiles',
            'Failed to load saved profiles. You can still create invoices manually.'
          );
        }
      });
    this.subs.add(s1);
    this.subs.add(s2);
    this.subs.add(s3);
    this.subs.add(s4);
    this.subs.add(s5);

    // Setup debounced HS code search
    this.subs.add(
      this.hsCodeSearchSubject
        .pipe(
          debounceTime(300), // Wait 300ms after user stops typing
          distinctUntilChanged() // Only trigger if the search term changed
        )
        .subscribe(searchTerm => this.performHsCodeSearch(searchTerm))
    );

    // track province code (for origination supplier) when province text changes
    this.subs.add(
      combineLatest([
        this.invoiceForm.get('sellerProvince')!.valueChanges,
        this.invoiceForm.get('buyerProvince')!.valueChanges,
      ]).subscribe(() => {
        this.syncProvinceCodes();
      })
    );

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.invoiceId = +params['id'];
        this.loadInvoice();
      } else {
        this.addItem(); // Add first item for new invoice
      }
    });
    this.invoiceForm.get('advanceTax236G')?.valueChanges.subscribe(value => {
      if (value) { // Your condition here
        if (!this.invoiceForm.get('advanceTax236H')?.disabled) {
          this.invoiceForm.get('advanceTax236H')?.disable();
        }
      } else {
        if (this.invoiceForm.get('advanceTax236H')?.disabled) {
          this.invoiceForm.get('advanceTax236H')?.enable();
        }
      }
    });
    this.invoiceForm.get('advanceTax236H')?.valueChanges.subscribe(value => {
      if (value) { // Your condition here
        if (!this.invoiceForm.get('advanceTax236G')?.disabled) {
          this.invoiceForm.get('advanceTax236G')?.disable();
        }
      } else {
        if (this.invoiceForm.get('advanceTax236G')?.disabled) {
          this.invoiceForm.get('advanceTax236G')?.enable();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private syncProvinceCodes(): void {
    const seller = this.invoiceForm.get('sellerProvince')!.value;
    const buyer = this.invoiceForm.get('buyerProvince')!.value;

    const sellerMatch = this.provinceOptions.find(
      (p) => p.description === seller
    );
    const buyerMatch = this.provinceOptions.find(
      (p) => p.description === buyer
    );

    this.invoiceForm.patchValue(
      {
        sellerProvinceCode: sellerMatch?.code ?? null,
        buyerProvinceCode: buyerMatch?.code ?? null,
      },
      { emitEvent: false }
    );
  }

  private ensureProvincesAndFetchRates(itemGroup: FormGroup): void {
    // First ensure province codes are synced
    this.syncProvinceCodes();

    // Use a more robust retry mechanism with increasing delays
    let retryCount = 0;
    const maxRetries = 5;

    const tryFetchRates = () => {
      const sellerProvinceCode = this.invoiceForm.get('sellerProvinceCode')?.value;

      if (sellerProvinceCode) {
        // Province code is available, fetch rates
        this.fetchRateForItem(itemGroup);
      } else if (retryCount < maxRetries) {
        // Province code not ready, retry with exponential backoff
        retryCount++;
        const delay = Math.min(100 * Math.pow(2, retryCount), 2000); // 200ms, 400ms, 800ms, 1600ms, 2000ms
        setTimeout(() => {
          this.syncProvinceCodes(); // Try syncing again
          tryFetchRates();
        }, delay);
      } else {
        console.warn('Could not sync province codes after multiple retries');
      }
    };

    // Start the process
    tryFetchRates();
  }

  private refreshRatesForAllItems(): void {
    // Refresh rate fetching for all items that have sale types selected
    this.itemsFormArray.controls.forEach((itemControl) => {
      const saleType = itemControl.get('saleType')?.value;
      if (saleType) {
        // This item has a sale type selected, refresh its rates
        this.ensureProvincesAndFetchRates(itemControl as FormGroup);
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      invoiceType: ['', Validators.required],
      invoiceDate: [new Date(), Validators.required],
      sellerNTNCNIC: ['', Validators.required],
      sellerBusinessName: ['', Validators.required],
      sellerProvince: ['', Validators.required],
      sellerProvinceCode: [null], // hidden helper for originationSupplier
      sellerAddress: ['', Validators.required],
      buyerNTNCNIC: ['', Validators.required],
      buyerBusinessName: ['', Validators.required],
      buyerProvince: ['', Validators.required],
      buyerProvinceCode: [null], // hidden helper
      buyerAddress: ['', Validators.required],
      buyerRegistrationType: ['', Validators.required],
      advanceTax236G: [''],
      advanceTax236H: [''],
      invoiceRefNo: [''],
      scenarioId: ['', Validators.required],
      items: this.fb.array([]),
    });
  }

  get itemsFormArray(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItemForm(): FormGroup {
    const grp = this.fb.group({
      hsCode: ['', Validators.required],
      productDescription: ['', Validators.required],
      rate: ['', Validators.required],
      uoM: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      totalValues: [0],
      valueSalesExcludingST: [0, [Validators.required, Validators.min(0)]],
      fixedNotifiedValueOrRetailPrice: [0],
      salesTaxApplicable: [0, [Validators.required, Validators.min(0)]],
      salesTaxWithheldAtSource: [0],
      extraTax: [''],
      furtherTax: [0],
      sroScheduleNo: [''],
      fedPayable: [0],
      discount: [0, [Validators.min(0)]],
      saleType: [''],
      sroItemSerialNo: [''],

      // helper hidden fields for cascading
      transTypeId: [null as number | null],
      rateId: [null as number | null],
      sroId: [null as number | null],
    });

    // cascade: saleType -> transTypeId -> rate -> schedule -> item
    this.subs.add(
      grp.get('saleType')!.valueChanges.subscribe((desc: string | null) => {
        if (desc !== null) {
          const tt = this.saleTypeOptions.find((x) => x.description === desc);

          // Reset SRO fields immediately when sale type changes
          grp.patchValue({
            transTypeId: tt?.id ?? null,
            sroScheduleNo: '',
            sroItemSerialNo: '',
            sroId: null
          }, { emitEvent: false });

          // Ensure province codes are synced before fetching rates
          this.ensureProvincesAndFetchRates(grp);
        }
      })
    );

    // recompute chain when sellerProvinceCode changes (origination supplier)
    this.subs.add(
      this.invoiceForm.get('sellerProvinceCode')!.valueChanges.subscribe(() => {
        this.fetchRateForItem(grp);
      })
    );

    // Add subscriptions to recalculate totals when key fields change
    // We need to defer this to get the correct index after the form is added
    setTimeout(() => {
      const itemIndex = this.itemsFormArray.controls.indexOf(grp);

      // Recalculate when quantity changes
      this.subs.add(
        grp.get('quantity')!.valueChanges.subscribe(() => {
          this.calculateItemTotal(itemIndex);
        })
      );

      // Recalculate when unit price changes
      this.subs.add(
        grp.get('valueSalesExcludingST')!.valueChanges.subscribe(() => {
          this.calculateItemTotal(itemIndex, 'valueSalesExcludingST');
        })
      );

      // Recalculate when fixed notified value changes (user edited it)
      this.subs.add(
        grp.get('fixedNotifiedValueOrRetailPrice')!.valueChanges.subscribe(() => {
          this.calculateItemTotal(itemIndex, 'fixedNotifiedValueOrRetailPrice');
        })
      );

      // Recalculate when tax rate changes
      this.subs.add(
        grp.get('salesTaxApplicable')!.valueChanges.subscribe(() => {
          this.calculateItemTotal(itemIndex);
        })
      );

      // Recalculate when discount changes
      this.subs.add(
        grp.get('discount')!.valueChanges.subscribe(() => {
          this.calculateItemTotal(itemIndex);
        })
      );

      // Recalculate when further tax changes
      this.subs.add(
        grp.get('furtherTax')!.valueChanges.subscribe(() => {
          this.calculateItemTotal(itemIndex);
        })
      );

      // Recalculate when FED payable changes
      this.subs.add(
        grp.get('fedPayable')!.valueChanges.subscribe(() => {
          this.calculateItemTotal(itemIndex);
        })
      );

      // Handle rate selection changes
      this.subs.add(
        grp.get('rate')!.valueChanges.subscribe((selectedRateDesc: string | null) => {
          if (selectedRateDesc) {
            // Find the selected rate's ID and value, update hidden fields
            const rateOptions = this.rateOptionsMap.get(itemIndex) || [];
            const selectedRate = rateOptions.find(r => r.description === selectedRateDesc);
            if (selectedRate) {
              grp.patchValue({ 
                rateId: selectedRate.id,
                salesTaxApplicable: selectedRate.value 
              }, { emitEvent: false });
              // Recalculate totals with new rate
              this.calculateItemTotal(itemIndex);
              // Fetch SRO schedule for the newly selected rate
              this.fetchSroScheduleForItem(grp);
            }
          }
        })
      );

      // Handle SRO schedule selection changes
      this.subs.add(
        grp.get('sroScheduleNo')!.valueChanges.subscribe((selectedScheduleDesc: string | null) => {
          if (selectedScheduleDesc) {
            // Find the selected schedule's ID and update the hidden field
            const scheduleOptions = this.sroScheduleOptionsMap.get(itemIndex) || [];
            const selectedSchedule = scheduleOptions.find(s => s.description === selectedScheduleDesc);
            if (selectedSchedule) {
              grp.patchValue({ sroId: selectedSchedule.id }, { emitEvent: false });
              // Fetch SRO items for the newly selected schedule
              this.fetchSroItemsForItem(grp);
            }
          }
        })
      );
    }, 0);

    return grp;
  }

  private fetchRateForItem(itemGroup: FormGroup): void {
    const transTypeId: number | null = itemGroup.get('transTypeId')!.value;
    const origSupplier: number | null =
      this.invoiceForm.get('sellerProvinceCode')!.value;

    if (!transTypeId || !origSupplier) {
      return;
    }

    const itemIndex = this.itemsFormArray.controls.indexOf(itemGroup);
    
    // Set loading state
    this.rateLoadingMap.set(itemIndex, true);

    this.fbr.getSaleTypeToRate(transTypeId, origSupplier).subscribe({
      next: (rates) => {
        // Clear loading state
        this.rateLoadingMap.set(itemIndex, false);
        
        if (!rates?.length) return;
        
        // Store all rate options for this item
        const rateOptions = rates.map((r: any) => ({
          id: r.ratE_ID,
          description: r.ratE_DESC,
          value: r.ratE_VALUE
        }));
        this.rateOptionsMap.set(itemIndex, rateOptions);
        
        // Auto-select first rate option
        const firstRate = rates[0];
        itemGroup.patchValue(
          {
            rate: firstRate.ratE_DESC, // set the human-readable rate in your form
            rateId: firstRate.ratE_ID,
            salesTaxApplicable: firstRate.ratE_VALUE, // set the actual tax percentage value
          },
          { emitEvent: false }
        );

        // Recalculate item total after tax rate is updated
        if (itemIndex >= 0) {
          this.calculateItemTotal(itemIndex);
        }

        // Next: SRO schedule
        this.fetchSroScheduleForItem(itemGroup);
      },
      error: (error) => {
        // Clear loading state and options on error
        this.rateLoadingMap.set(itemIndex, false);
        this.rateOptionsMap.delete(itemIndex);
        this.handleDynamicLookupError('tax rates', error);
      },
    });
  }

  private fetchSroScheduleForItem(itemGroup: FormGroup): void {
    const rateId: number | null = itemGroup.get('rateId')!.value;
    const origSupplierCsv: number | null =
      this.invoiceForm.get('sellerProvinceCode')!.value;
    if (!rateId || !origSupplierCsv) return;

    const itemIndex = this.itemsFormArray.controls.indexOf(itemGroup);
    
    // Set loading state
    this.sroScheduleLoadingMap.set(itemIndex, true);

    this.fbr.getSroSchedule(rateId, origSupplierCsv).subscribe({
      next: (schedules) => {
        // Clear loading state
        this.sroScheduleLoadingMap.set(itemIndex, false);
        
        if (!schedules?.length) return;
        
        // Store all SRO schedule options for this item
        const sroOptions = schedules.map((s: any) => ({
          id: s.srO_ID,
          description: s.srO_DESC
        }));
        this.sroScheduleOptionsMap.set(itemIndex, sroOptions);
        
        // Auto-select first option
        const firstSchedule = schedules[0];
        itemGroup.patchValue(
          {
            sroScheduleNo: firstSchedule.srO_DESC,
            sroId: firstSchedule.srO_ID,
          },
          { emitEvent: false }
        );

        // Next: SRO items (serial)
        this.fetchSroItemsForItem(itemGroup);
      },
      error: (error) => {
        // Clear loading state and options on error
        this.sroScheduleLoadingMap.set(itemIndex, false);
        this.sroScheduleOptionsMap.delete(itemIndex);
        itemGroup.patchValue(
          {
            sroScheduleNo: null,
            sroId: null,
          },
          { emitEvent: false }
        );
        this.handleDynamicLookupError('SRO schedule', error);
      },
    });
  }

  private fetchSroItemsForItem(itemGroup: FormGroup): void {
    const sroId: number | null = itemGroup.get('sroId')!.value;
    if (!sroId) return;

    const itemIndex = this.itemsFormArray.controls.indexOf(itemGroup);
    
    // Set loading state
    this.sroItemLoadingMap.set(itemIndex, true);

    this.fbr.getSroItems(sroId).subscribe({
      next: (items) => {
        // Clear loading state
        this.sroItemLoadingMap.set(itemIndex, false);
        
        if (!items?.length) return;
        
        // Store all SRO item options for this item
        const itemOptions = items.map((it: any) => ({
          id: it.srO_ITEM_ID || it.id, // Handle different API response structures
          description: it.srO_ITEM_DESC
        }));
        this.sroItemOptionsMap.set(itemIndex, itemOptions);
        
        // Auto-select first option
        const firstItem = items[0];
        itemGroup.patchValue(
          { sroItemSerialNo: firstItem.srO_ITEM_DESC },
          { emitEvent: false }
        );
      },
      error: (error) => {
        // Clear loading state and options on error
        this.sroItemLoadingMap.set(itemIndex, false);
        this.sroItemOptionsMap.delete(itemIndex);
        this.handleDynamicLookupError('SRO items', error);
      },
    });
  }

  addItem(): void {
    this.itemsFormArray.push(this.createItemForm());
  }

  removeItem(index: number): void {
    if (this.itemsFormArray.length > 1) {
      // Clean up all options maps and loading states when removing item
      this.rateOptionsMap.delete(index);
      this.sroScheduleOptionsMap.delete(index);
      this.sroItemOptionsMap.delete(index);
      this.rateLoadingMap.delete(index);
      this.sroScheduleLoadingMap.delete(index);
      this.sroItemLoadingMap.delete(index);
      
      // Reindex remaining items in all maps
      const rateEntries = Array.from(this.rateOptionsMap.entries());
      const scheduleEntries = Array.from(this.sroScheduleOptionsMap.entries());
      const itemEntries = Array.from(this.sroItemOptionsMap.entries());
      const rateLoadingEntries = Array.from(this.rateLoadingMap.entries());
      const scheduleLoadingEntries = Array.from(this.sroScheduleLoadingMap.entries());
      const itemLoadingEntries = Array.from(this.sroItemLoadingMap.entries());
      
      this.rateOptionsMap.clear();
      this.sroScheduleOptionsMap.clear();
      this.sroItemOptionsMap.clear();
      this.rateLoadingMap.clear();
      this.sroScheduleLoadingMap.clear();
      this.sroItemLoadingMap.clear();
      
      rateEntries.forEach(([oldIndex, options]) => {
        if (oldIndex > index) {
          this.rateOptionsMap.set(oldIndex - 1, options);
        } else if (oldIndex < index) {
          this.rateOptionsMap.set(oldIndex, options);
        }
      });
      
      scheduleEntries.forEach(([oldIndex, options]) => {
        if (oldIndex > index) {
          this.sroScheduleOptionsMap.set(oldIndex - 1, options);
        } else if (oldIndex < index) {
          this.sroScheduleOptionsMap.set(oldIndex, options);
        }
      });
      
      itemEntries.forEach(([oldIndex, options]) => {
        if (oldIndex > index) {
          this.sroItemOptionsMap.set(oldIndex - 1, options);
        } else if (oldIndex < index) {
          this.sroItemOptionsMap.set(oldIndex, options);
        }
      });

      // Reindex loading states
      rateLoadingEntries.forEach(([oldIndex, loading]) => {
        if (oldIndex > index) {
          this.rateLoadingMap.set(oldIndex - 1, loading);
        } else if (oldIndex < index) {
          this.rateLoadingMap.set(oldIndex, loading);
        }
      });

      scheduleLoadingEntries.forEach(([oldIndex, loading]) => {
        if (oldIndex > index) {
          this.sroScheduleLoadingMap.set(oldIndex - 1, loading);
        } else if (oldIndex < index) {
          this.sroScheduleLoadingMap.set(oldIndex, loading);
        }
      });

      itemLoadingEntries.forEach(([oldIndex, loading]) => {
        if (oldIndex > index) {
          this.sroItemLoadingMap.set(oldIndex - 1, loading);
        } else if (oldIndex < index) {
          this.sroItemLoadingMap.set(oldIndex, loading);
        }
      });
      
      this.itemsFormArray.removeAt(index);
    }
  }

  // Helper methods for template
  getRateOptions(index: number): { id: number; description: string; value: number }[] {
    return this.rateOptionsMap.get(index) || [];
  }

  getSroScheduleOptions(index: number): { id: number; description: string }[] {
    return this.sroScheduleOptionsMap.get(index) || [];
  }

  getSroItemOptions(index: number): { id: number; description: string }[] {
    return this.sroItemOptionsMap.get(index) || [];
  }

  // Loading state helpers for template
  isRateLoading(index: number): boolean {
    return this.rateLoadingMap.get(index) || false;
  }

  isSroScheduleLoading(index: number): boolean {
    return this.sroScheduleLoadingMap.get(index) || false;
  }

  isSroItemLoading(index: number): boolean {
    return this.sroItemLoadingMap.get(index) || false;
  }

  calculateItemTotal(index: number, triggeredByField?: string): void {
    const item = this.itemsFormArray.at(index);
    const valueExcludingST = parseFloat(item.get('valueSalesExcludingST')?.value) || 0;
    const fixedNotifiedValue = parseFloat(item.get('fixedNotifiedValueOrRetailPrice')?.value) || 0;
    const rateString = item.get('rate')?.value || '';
    const discount = parseFloat(item.get('discount')?.value) || 0;
    const furtherTax = parseFloat(item.get('furtherTax')?.value) || 0;
    const fedPayable = parseFloat(item.get('fedPayable')?.value) || 0;

    // Extract percentage from rate string (e.g., "18%" -> 18)
    const ratePercentage = parseFloat(rateString.replace('%', '')) || 0;

    // Use fixedNotifiedValue for tax calculation, fallback to valueExcludingST if fixedNotifiedValue is 0
    const taxBaseAmount = fixedNotifiedValue > 0 ? fixedNotifiedValue : valueExcludingST;
    
    // Calculate sales tax amount using rate percentage on the tax base (fixedNotifiedValue)
    const salesTaxAmount = taxBaseAmount * (ratePercentage / 100);

    // Calculate total value: taxBaseAmount + salesTaxAmount + furtherTax + fedPayable - discount
    const totalValue = taxBaseAmount + salesTaxAmount + furtherTax + fedPayable - discount;
    
    // Round for precision
    const roundedSalesTaxAmount = Math.round(salesTaxAmount * 100) / 100;
    const roundedTotalValue = Math.round(totalValue * 100) / 100;

    const updateValues: any = {
      salesTaxApplicable: roundedSalesTaxAmount, // Calculated tax amount based on fixedNotifiedValue
      totalValues: roundedTotalValue // Final total
    };

    // Only update fixedNotifiedValue when valueSalesExcludingST changes (not when fixedNotifiedValue itself changes)
    if (triggeredByField === 'valueSalesExcludingST' && valueExcludingST > 0) {
      updateValues.fixedNotifiedValueOrRetailPrice = valueExcludingST;
    }
    // Initial population: if fixedNotifiedValue is 0 and we have a valueExcludingST
    else if (fixedNotifiedValue === 0 && valueExcludingST > 0 && !triggeredByField) {
      updateValues.fixedNotifiedValueOrRetailPrice = valueExcludingST;
    }

    item.patchValue(updateValues, { emitEvent: false });
  }

  recalculateItemTotal(index: number): void {
    // Same calculation as calculateItemTotal but with user confirmation
    this.calculateItemTotal(index);
  }

  getItemTotal(index: number): number {
    const item = this.itemsFormArray.at(index);
    return item.get('totalValues')?.value || 0;
  }

  getGrandTotal(): number {
    let total = this.itemsFormArray.controls.reduce((total, item) => {
      return total + (item.get('totalValues')?.value || 0);
    }, 0);
    if (this.invoiceForm.get('advanceTax236G')?.value && this.invoiceForm.get('advanceTax236G')?.value !== '') {
      total = total + (total * (this.invoiceForm.get('advanceTax236G')?.value/ 100));
    } else if (this.invoiceForm.get('advanceTax236H')?.value && this.invoiceForm.get('advanceTax236H')?.value !== '') {
      total = total + (total * (this.invoiceForm.get('advanceTax236H')?.value / 100));
    }
    return total;
  }

  loadInvoice(): void {
    if (!this.invoiceId) return;

    this.loading = true;
    this.invoiceService.getInvoiceById(this.invoiceId).subscribe({
      next: (response) => {
        const invoice = response.data;
        this.populateForm(invoice);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.notificationService.error('Error', 'Failed to load invoice');
        this.loading = false;
      },
    });
  }

  populateForm(invoice: Invoice): void {
    // Clear existing items
    while (this.itemsFormArray.length !== 0) {
      this.itemsFormArray.removeAt(0);
    }

    // Populate basic form data
    this.invoiceForm.patchValue({
      invoiceType: invoice.invoiceType,
      invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate) : null,
      sellerNTNCNIC: invoice.sellerNTNCNIC,
      sellerBusinessName: invoice.sellerBusinessName,
      sellerProvince: invoice.sellerProvince,
      sellerAddress: invoice.sellerAddress,
      buyerNTNCNIC: invoice.buyerNTNCNIC,
      buyerBusinessName: invoice.buyerBusinessName,
      buyerProvince: invoice.buyerProvince,
      buyerAddress: invoice.buyerAddress,
      buyerRegistrationType: invoice.buyerRegistrationType,
      advanceTax236G: invoice.advanceTax236G,
      advanceTax236H: invoice.advanceTax236H,
      invoiceRefNo: invoice.invoiceRefNo,
      scenarioId: invoice.scenarioId,
    });

    // Check if province options are loaded, if not wait for them
    if (this.provinceOptions.length === 0) {
      // Wait for province options to load
      const checkProvinceOptions = () => {
        if (this.provinceOptions.length > 0) {
          this.syncProvinceCodes();
          this.addItemsAfterSync(invoice);
        } else {
          setTimeout(checkProvinceOptions, 100);
        }
      };
      setTimeout(checkProvinceOptions, 100);
    } else {
      // Province options already loaded, proceed normally
      this.syncProvinceCodes();
      this.addItemsAfterSync(invoice);
    }
  }

  private addItemsAfterSync(invoice: Invoice): void {
    // Wait a bit more to ensure province codes are set
    setTimeout(() => {
      const sellerProvinceCode = this.invoiceForm.get('sellerProvinceCode')?.value;

      // Add items after province codes are properly set
      invoice.items.forEach((itm, index) => {
        const itemForm = this.createItemForm();
        itemForm.patchValue(itm);
        this.itemsFormArray.push(itemForm);

        // Only trigger cascade if we have the required province code
        if (sellerProvinceCode && itm.saleType) {
          // Set the sale type which will trigger the cascade
          itemForm.patchValue({ saleType: itm.saleType }, { emitEvent: true });
        }
      });
    }, 200); // Increased delay to ensure province codes are set
  }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      this.saveInvoice('pending'); // Default to pending status
    } else {
      this.markFormGroupTouched(this.invoiceForm);
      this.notificationService.error(
        'Validation Error',
        'Please fill all required fields'
      );
    }
  }

  saveDraft(): void {
    this.saveInvoice('draft');
  }

  saveInvoice(status: string = 'pending'): void {
    this.saving = true;
    const formValue = this.invoiceForm.value;

    const invoiceData: Invoice = {
      ...formValue,
      status: status, // Set the status from parameter (draft or pending)
      invoiceDate: formValue.invoiceDate
        ? formValue.invoiceDate.toISOString()
        : null,
      items: formValue.items.map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        totalValues: Number(item.totalValues),
        valueSalesExcludingST: Number(item.valueSalesExcludingST),
        fixedNotifiedValueOrRetailPrice: Number(
          item.fixedNotifiedValueOrRetailPrice
        ),
        salesTaxApplicable: Number(item.salesTaxApplicable),
        salesTaxWithheldAtSource: Number(item.salesTaxWithheldAtSource),
        furtherTax: Number(item.furtherTax),
        fedPayable: Number(item.fedPayable),
        discount: Number(item.discount),
        // helper fields (transTypeId, rateId, sroId) are included in payload;
        // if DB schema doesn't need them, strip them here
      })),
    };

    const operation = this.isEditMode
      ? this.invoiceService.updateInvoice(this.invoiceId!, invoiceData)
      : this.invoiceService.createInvoice(invoiceData);

    operation.subscribe({
      next: () => {
        this.saving = false;
        const message = this.isEditMode
          ? 'Invoice updated successfully'
          : 'Invoice created successfully';
        this.notificationService.success('Success', message);
        this.router.navigate(['/invoices/list']);
      },
      error: (error) => {
        console.error('Error saving invoice:', error);
        this.saving = false;
      },
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach((arrayControl) => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/invoices/list']);
  }

  // HS Code search optimization methods
  onHsCodeSearch(searchEvent: any): void {
    let searchTerm = '';

    // Handle different types of search events from ng-select
    if (typeof searchEvent === 'string') {
      searchTerm = searchEvent;
    } else if (searchEvent && typeof searchEvent.term === 'string') {
      searchTerm = searchEvent.term;
    } else if (searchEvent && typeof searchEvent === 'object' && searchEvent.target && searchEvent.target.value) {
      searchTerm = searchEvent.target.value;
    }

    // Use the debounced search subject
    this.hsCodeSearchSubject.next(searchTerm);
  }

  private performHsCodeSearch(searchTerm: string): void {
    // Ensure searchTerm is a string and handle null/undefined cases
    const term = typeof searchTerm === 'string' ? searchTerm : '';

    if (!term || term.length < 2) {
      // Show first 50 items when no search or search is too short
      this.filteredHsCodeOptions = this.hsCodeOptions.slice(0, 50);
      return;
    }

    // Filter based on search term
    const searchLower = term.toLowerCase();
    const filtered = this.hsCodeOptions.filter(option =>
      option.hsCode.toLowerCase().includes(searchLower) ||
      option.description.toLowerCase().includes(searchLower)
    );

    // Limit to 100 results for performance
    this.filteredHsCodeOptions = filtered.slice(0, 100);
  }

  onHsCodeScrollToEnd(): void {
    // Load more items when scrolling to end (if not searching)
    if (this.filteredHsCodeOptions.length < this.hsCodeOptions.length) {
      const currentLength = this.filteredHsCodeOptions.length;
      const nextBatch = this.hsCodeOptions.slice(currentLength, currentLength + 50);
      this.filteredHsCodeOptions = [...this.filteredHsCodeOptions, ...nextBatch];
    }
  }

  // Profile integration methods
  populateSellerFromProfile(profileId: number | null): void {
    console.log('populateSellerFromProfile called with:', profileId, 'type:', typeof profileId);
    console.log('Available profiles:', this.profiles);

    if (!profileId) {
      return; // Don't clear fields when dropdown is cleared
    }

    // Convert profileId to number if it's a string
    const numericProfileId = typeof profileId === 'string' ? parseInt(profileId, 10) : profileId;
    console.log('Searching for profile with ID:', numericProfileId);

    const profile = this.profiles.find(p => {
      console.log('Comparing profile ID:', p.id, 'type:', typeof p.id, 'with search ID:', numericProfileId);
      return p.id === numericProfileId;
    });
    console.log('Found profile:', profile);

    if (profile) {
      this.invoiceForm.patchValue({
        sellerNTNCNIC: profile.ntncnic,
        sellerBusinessName: profile.businessName,
        sellerProvince: profile.province,
        sellerAddress: profile.address
      });
      console.log('Form patched with seller profile data');

      // Trigger province code sync after populating
      setTimeout(() => {
        this.syncProvinceCodes();
        // Also trigger rate fetching for any items that have sale types selected
        this.refreshRatesForAllItems();
      }, 200);
    }
  }

  populateBuyerFromProfile(profileId: number | null): void {
    console.log('populateBuyerFromProfile called with:', profileId, 'type:', typeof profileId);

    if (!profileId) {
      return; // Don't clear fields when dropdown is cleared
    }

    // Convert profileId to number if it's a string
    const numericProfileId = typeof profileId === 'string' ? parseInt(profileId, 10) : profileId;
    console.log('Searching for profile with ID:', numericProfileId);

    const profile = this.profiles.find(p => {
      console.log('Comparing profile ID:', p.id, 'type:', typeof p.id, 'with search ID:', numericProfileId);
      return p.id === numericProfileId;
    });
    console.log('Found profile:', profile);

    if (profile) {
      this.invoiceForm.patchValue({
        buyerNTNCNIC: profile.ntncnic,
        buyerBusinessName: profile.businessName,
        buyerProvince: profile.province,
        buyerAddress: profile.address,
        buyerRegistrationType: profile.registrationType
      });
      console.log('Form patched with buyer profile data');

      // Trigger province code sync after populating
      setTimeout(() => {
        this.syncProvinceCodes();
        // Also trigger rate fetching for any items that have sale types selected
        this.refreshRatesForAllItems();
      }, 200);
    }
  }

  // FBR error handling method
  private handleFbrLookupError(dataType: string, error: any): void {
    console.error(`Error loading FBR ${dataType}:`, error);

    let title = 'FBR Service Error';
    let message = `Failed to load ${dataType} from FBR. The FBR system might be temporarily unavailable. Please refresh the page or try again in 30 minutes.`;

    // Check if it's a network/timeout error
    if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
      message = `Connection timeout while loading ${dataType}. The FBR system might be slow or down. Please try refreshing the page or wait 30 minutes.`;
    } else if (error.status === 0 || !navigator.onLine) {
      message = `Network connection error while loading ${dataType}. Please check your internet connection and try again.`;
    } else if (error.status >= 500) {
      message = `FBR server error while loading ${dataType}. The FBR system might be temporarily down. Please try again in 30 minutes.`;
    }

    this.notificationService.error(title, message);
  }

  // Dynamic lookup error handling method
  private handleDynamicLookupError(dataType: string, error: any): void {
    console.error(`Error loading ${dataType}:`, error);

    let title = 'Tax Data Error';
    let message = `Failed to load ${dataType}. The FBR tax calculation system might be temporarily unavailable. You can continue entering other invoice details and try again later.`;

    if (error.status >= 500) {
      message = `FBR server error while loading ${dataType}. Please save your work and try refreshing the page in a few minutes.`;
    }

    this.notificationService.warning(title, message);
  }
}
