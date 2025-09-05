import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerComponent } from 'ng-zorro-antd/divider';
import {
  NzDropDownModule,
} from 'ng-zorro-antd/dropdown';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Invoice } from '../../../core/models/invoice';
import { InvoiceService } from '../../../core/services/invoice.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    NzCardComponent,
    NzStatisticModule,
    NzTagModule,
    NzDescriptionsModule,
    NzDropDownModule,
    NzTableModule,
    NzDividerComponent,
    NzDropDownModule,
    NzGridModule,
    NzSpinModule,
    NzTagModule,
  ],
  templateUrl: './invoice-detail.component.html',
  styles: [
    `
      .invoice-detail-container {
        padding: 0;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .header-left h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #262626;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      .detail-card {
        margin-bottom: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .item-description {
        max-width: 200px;
      }

      .item-meta {
        margin-top: 4px;
      }

      .item-meta small {
        color: #8c8c8c;
      }

      .total-amount {
        color: #1890ff;
        font-size: 14px;
      }

      .invoice-summary {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
      }

      .summary-content {
        min-width: 300px;
        background: #fafafa;
        padding: 16px;
        border-radius: 6px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        padding: 4px 0;
      }

      .summary-row:last-child {
        margin-bottom: 0;
      }

      .grand-total {
        font-size: 16px;
        color: #1890ff;
      }

      .text-danger {
        color: #ff4d4f !important;
      }

      :host ::ng-deep .ant-statistic-title {
        font-size: 14px;
        color: #8c8c8c;
        margin-bottom: 8px;
      }

      :host ::ng-deep .ant-descriptions-item-label {
        font-weight: 500;
        background-color: #fafafa;
      }

      :host ::ng-deep .ant-table-thead > tr > th {
        background-color: #fafafa;
        font-weight: 600;
      }
    `,
  ],
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null;
  loading = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private notificationService: NotificationService
  ) {}
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.loadInvoice(+params['id']);
      }
    });
  }
  loadInvoice(id: number): void {
    this.loading = true;
    this.invoiceService.getInvoiceById(id).subscribe({
      next: (response) => {
        this.invoice = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading invoice:', error);
        this.notificationService.error('Error', 'Failed to load invoice');
        this.loading = false;
      },
    });
  }
  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      pending: 'orange',
      completed: 'green',
      cancelled: 'red',
      draft: 'blue',
    };
    return statusColors[status.toLowerCase()] || 'default';
  }
  getSubtotal(): number {
    if (!this.invoice?.items) return 0;
    return this.invoice.items.reduce(
      (sum, item) => sum + Number(item.valueSalesExcludingST),
      0
    );
  }
  getTotalSalesTax(): number {
    if (!this.invoice?.items) return 0;
    return this.invoice.items.reduce(
      (sum, item) => sum + Number(item.salesTaxApplicable),
      0
    );
  }
  getTotalFED(): number {
    if (!this.invoice?.items) return 0;
    return this.invoice.items.reduce(
      (sum, item) => sum + Number(item.fedPayable),
      0
    );
  }
  getTotalDiscount(): number {
    if (!this.invoice?.items) return 0;
    return this.invoice.items.reduce(
      (sum, item) => sum + Number(item.discount),
      0
    );
  }
  getTotalFurtherTax(): number {
    if (!this.invoice?.items) return 0;
    return this.invoice.items.reduce(
      (sum, item) => sum + Number(item.furtherTax),
      0
    );
  }
  goBack(): void {
    this.router.navigate(['/invoices/list']);
  }
  editInvoice(): void {
    if (this.invoice?.id) {
      this.router.navigate(['/invoices/edit', this.invoice.id]);
    }
  }
  changeStatus(status: string): void {
    if (!this.invoice?.id) return;
    this.invoiceService.updateInvoiceStatus(this.invoice.id, status).subscribe({
      next: (response) => {
        this.invoice = response.data;
        this.notificationService.success(
          'Success',
          `Invoice status updated to ${status}`
        );
      },
      error: (error) => {
        console.error('Error updating status:', error);
      },
    });
  }
  deleteInvoice(): void {
    if (!this.invoice?.id) return;
    this.invoiceService.deleteInvoice(this.invoice.id).subscribe({
      next: () => {
        this.notificationService.success(
          'Success',
          'Invoice deleted successfully'
        );
        this.router.navigate(['/invoices/list']);
      },
      error: (error) => {
        console.error('Error deleting invoice:', error);
      },
    });
  }
  downloadPDF(): void {
    if (!this.invoice?.id) return;
    this.invoiceService.downloadPDF(this.invoice.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = this.invoice!.invoiceNumber 
          ? `invoice-${this.invoice!.invoiceNumber}.pdf`
          : `invoice-${this.invoice!.id}.pdf`;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        this.notificationService.success(
          'Success',
          'PDF downloaded successfully'
        );
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
      },
    });
  }
}
