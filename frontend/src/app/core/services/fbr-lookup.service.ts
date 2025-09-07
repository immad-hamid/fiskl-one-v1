import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  /** Provinces (server-side cached) */
  getProvinces(): Observable<{ code: number; description: string }[]> {
    return this.http.get<{ code: number; description: string }[]>(
      `${this.apiUrl}/fbr/provinces`
    );
  }

  /** Transaction types (server-side cached) -> normalized { id, description } */
  getTransactionTypes(): Observable<{ id: number; description: string }[]> {
    return this.http.get<{ id: number; description: string }[]>(
      `${this.apiUrl}/fbr/transtypes`
    );
  }

  /** HS Codes */
  getHsCodes(): Observable<{ hsCode: string; description: string }[]> {
    return this.http.get<{ hsCode: string; description: string }[]>(
      `${this.apiUrl}/fbr/itemdescs`
    );
  }

  /** Units of Measure */
  getUoms(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(
      `${this.apiUrl}/fbr/uoms`
    );
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
}
