import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, shareReplay, of } from 'rxjs';
import { environment } from '../../../environments/environment';


type SaleTypeRateRaw = {
  ratE_ID: number;
  ratE_DESC: string;
  ratE_VALUE: number;
};
type SroScheduleRaw = { srO_ID: number; serNo: number; srO_DESC: string };
type SroItemRaw = { srO_ITEM_ID: number; srO_ITEM_DESC: string };

@Injectable({ providedIn: 'root' })
export class FbrLookupService {
  private apiUrl = environment.apiUrl;

  // Cache observables for reference data - cached until app refresh
  private provincesCache$?: Observable<{ code: number; description: string }[]>;
  private transactionTypesCache$?: Observable<{ id: number; description: string }[]>;
  private hsCodesCache$?: Observable<{ hsCode: string; description: string }[]>;
  private uomsCache$?: Observable<{ id: number; name: string }[]>;

  constructor(private http: HttpClient) {}

  /** Provinces (client-side cached) */
  getProvinces(): Observable<{ code: number; description: string }[]> {
    if (!this.provincesCache$) {
      this.provincesCache$ = this.http.get<{ code: number; description: string }[]>(
        `${this.apiUrl}/fbr/provinces`
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: false }) // Cache indefinitely
      );
    }
    return this.provincesCache$;
  }

  /** Transaction types (client-side cached) -> normalized { id, description } */
  getTransactionTypes(): Observable<{ id: number; description: string }[]> {
    if (!this.transactionTypesCache$) {
      this.transactionTypesCache$ = this.http.get<{ id: number; description: string }[]>(
        `${this.apiUrl}/fbr/transtypes`
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: false }) // Cache indefinitely
      );
    }
    return this.transactionTypesCache$;
  }

  /** HS Codes (client-side cached) */
  getHsCodes(): Observable<{ hsCode: string; description: string }[]> {
    if (!this.hsCodesCache$) {
      this.hsCodesCache$ = this.http.get<{ hsCode: string; description: string }[]>(
        `${this.apiUrl}/fbr/itemdescs`
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: false }) // Cache indefinitely
      );
    }
    return this.hsCodesCache$;
  }

  /** Units of Measure (client-side cached) */
  getUoms(): Observable<{ id: number; name: string }[]> {
    if (!this.uomsCache$) {
      this.uomsCache$ = this.http.get<{ id: number; name: string }[]>(
        `${this.apiUrl}/fbr/uoms`
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: false }) // Cache indefinitely
      );
    }
    return this.uomsCache$;
  }

  /** SaleTypeToRate */
  getSaleTypeToRate(
    transTypeId: number,
    originationSupplier: number,
    date?: string
  ) {
    let params = new HttpParams()
      .set('transTypeId', String(transTypeId))
      .set('originationSupplier', String(originationSupplier));
    if (date) params = params.set('date', date);

    return this.http.get<SaleTypeRateRaw[]>(`${this.apiUrl}/fbr/saletype-rate`, {
      params,
    });
  }

  /** SRO Schedule */
  getSroSchedule(
    rateId: number,
    originationSupplierCsv: number | string,
    date?: string
  ) {
    let params = new HttpParams()
      .set('rate_id', String(rateId))
      .set('origination_supplier_csv', String(originationSupplierCsv));
    if (date) params = params.set('date', date);

    return this.http.get<SroScheduleRaw[]>(`${this.apiUrl}/fbr/sro-schedule`, {
      params,
    });
  }

  /** SRO Items */
  getSroItems(sroId: number, date?: string) {
    let params = new HttpParams().set('sro_id', String(sroId));
    if (date) params = params.set('date', date);

    return this.http.get<SroItemRaw[]>(`${this.apiUrl}/fbr/sro-item`, {
      params,
    });
  }

  /** Cache management methods */
  
  // Clear all reference data caches (useful for data refresh or logout)
  clearReferenceDataCache(): void {
    this.provincesCache$ = undefined;
    this.transactionTypesCache$ = undefined;
    this.hsCodesCache$ = undefined;
    this.uomsCache$ = undefined;
    console.log('FBR reference data cache cleared');
  }

  // Check if reference data is cached
  isReferenceDataCached(): boolean {
    return !!(this.provincesCache$ && this.transactionTypesCache$ && 
             this.hsCodesCache$ && this.uomsCache$);
  }

  // Preload all reference data (useful for app initialization)
  preloadReferenceData(): Observable<any> {
    return of(null).pipe(
      map(() => {
        // Trigger all cache loading
        this.getProvinces().subscribe();
        this.getTransactionTypes().subscribe();
        this.getHsCodes().subscribe();
        this.getUoms().subscribe();
        console.log('FBR reference data preloaded');
      })
    );
  }
}
