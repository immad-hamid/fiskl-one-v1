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
      .subscribe((v) => (this.provinceOptions = v));
    const s2 = this.fbr.getHsCodes().subscribe((v) => {
      this.hsCodeOptions = v;
      // Initialize with first 50 items for better performance
      this.filteredHsCodeOptions = v.slice(0, 50);
    });
    const s3 = this.fbr.getUoms().subscribe((v) => (this.uomOptions = v));
    const s4 = this.fbr
      .getTransactionTypes()
      .subscribe((v) => (this.saleTypeOptions = v));
    const s5 = this.profileService
      .getProfiles()
      .subscribe((response) => (this.profiles = response.data));
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
      rateId: [null],
      sroId: [null],
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
          this.calculateItemTotal(itemIndex);
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

    this.fbr.getSaleTypeToRate(transTypeId, origSupplier).subscribe({
      next: (rates) => {
        if (!rates?.length) return;
        // choose first (or present a selection UI if multiple)
        const r = rates[0];
        itemGroup.patchValue(
          {
            rate: r.ratE_DESC, // set the human-readable rate in your form
            rateId: r.ratE_ID,
            salesTaxApplicable: r.ratE_VALUE, // set the actual tax percentage value
          },
          { emitEvent: false }
        );

        // Recalculate item total after tax rate is updated
        const itemIndex = this.itemsFormArray.controls.indexOf(itemGroup);
        if (itemIndex >= 0) {
          this.calculateItemTotal(itemIndex);
        }

        // Next: SRO schedule
        this.fetchSroScheduleForItem(itemGroup);
      },
      error: (error) => {
        console.error('Error fetching rates:', error);
      },
    });
  }

  private fetchSroScheduleForItem(itemGroup: FormGroup): void {
    const rateId: number | null = itemGroup.get('rateId')!.value;
    const origSupplierCsv: number | null =
      this.invoiceForm.get('sellerProvinceCode')!.value;
    if (!rateId || !origSupplierCsv) return;

    this.fbr.getSroSchedule(rateId, origSupplierCsv).subscribe({
      next: (schedules) => {
        if (!schedules?.length) return;
        const s = schedules[0];
        itemGroup.patchValue(
          {
            sroScheduleNo: s.srO_DESC,
            sroId: s.srO_ID,
          },
          { emitEvent: false }
        );

        // Next: SRO items (serial)
        this.fetchSroItemsForItem(itemGroup);
      },
      error: () => {
        itemGroup.patchValue(
          {
            sroScheduleNo: null,
            sroId: null,
          },
          { emitEvent: false }
        );
      },
    });
  }

  private fetchSroItemsForItem(itemGroup: FormGroup): void {
    const sroId: number | null = itemGroup.get('sroId')!.value;
    if (!sroId) return;

    this.fbr.getSroItems(sroId).subscribe({
      next: (items) => {
        if (!items?.length) return;
        // choose first by default; if you want a dropdown, wire one here
        const it = items[0];
        itemGroup.patchValue(
          { sroItemSerialNo: it.srO_ITEM_DESC },
          { emitEvent: false }
        );
      },
      error: () => {},
    });
  }

  addItem(): void {
    this.itemsFormArray.push(this.createItemForm());
  }

  removeItem(index: number): void {
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    }
  }

  calculateItemTotal(index: number): void {
    const item = this.itemsFormArray.at(index);
    const valueExcludingST = parseFloat(item.get('valueSalesExcludingST')?.value) || 0;
    const rateString = item.get('rate')?.value || '';
    const discount = parseFloat(item.get('discount')?.value) || 0;
    const furtherTax = parseFloat(item.get('furtherTax')?.value) || 0;
    const fedPayable = parseFloat(item.get('fedPayable')?.value) || 0;

    // Extract percentage from rate string (e.g., "18%" -> 18)
    const ratePercentage = parseFloat(rateString.replace('%', '')) || 0;
    
    // Calculate sales tax amount using rate percentage
    const salesTaxAmount = valueExcludingST * (ratePercentage / 100);
    
    // Calculate total value: valueSalesExcludingST + salesTaxAmount + furtherTax + fedPayable - discount
    const totalValue = valueExcludingST + salesTaxAmount + (valueExcludingST * furtherTax / 100) + fedPayable - discount;

    // Round for precision
    const roundedSalesTaxAmount = Math.round(salesTaxAmount * 100) / 100;
    const roundedTotalValue = Math.round(totalValue * 100) / 100;

    item.patchValue(
      {
        fixedNotifiedValueOrRetailPrice: valueExcludingST, // Same as valueSalesExcludingST by default
        salesTaxApplicable: roundedSalesTaxAmount, // Calculated tax amount (not percentage)
        totalValues: roundedTotalValue // Final total
      },
      { emitEvent: false }
    );
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
    return this.itemsFormArray.controls.reduce((total, item) => {
      return total + (item.get('totalValues')?.value || 0);
    }, 0);
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
}
