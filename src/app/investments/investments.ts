import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Investment, InvestmentSnapshot, InvestmentUpsertRequest } from '../models/investment.model';
import { InvestmentsRepository } from '../services/investments.repository';

type InvestmentForm = {
  type: 'stock' | 'other'; name: string; category: string; resource: string;
  currency: string; ticker: string; quantity: number | null; initialValue: number | null; valuationDate: string;
};

@Component({
  selector: 'app-investments', standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, FontAwesomeModule],
  templateUrl: './investments.html', styleUrl: './investments.scss'
})
export class Investments implements OnInit {
  readonly faChevronUp = faChevronUp;
  readonly faChevronDown = faChevronDown;
  investments: Investment[] = [];
  totalItems = 0;
  totalPages = 0;
  pageNumber = 1;
  pageSize = 20;
  sortBy = 'Name';
  sortOrder: 'asc' | 'desc' = 'asc';
  filters = {
    Name: '', Type: '', Category: '', Resource: '', Currency: '', Ticker: '',
    FromValue: null as number | null, ToValue: null as number | null,
    FromLastUpdatedAt: '', ToLastUpdatedAt: ''
  };
  loading = false;
  saving = false;
  error = '';
  editingId: string | null = null;
  formOpen = false;
  historyInvestment: Investment | null = null;
  history: InvestmentSnapshot[] = [];
  snapshotTarget: Investment | null = null;
  snapshotValue: number | null = null;
  snapshotCurrency = '';
  snapshotDate = '';

  form: InvestmentForm = this.emptyForm();

  constructor(private repo: InvestmentsRepository, private cdr: ChangeDetectorRef, private toastr: ToastrService,
    private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.syncStateFromQueryParams(params);
      this.load();
    });
  }

  private syncStateFromQueryParams(params: ParamMap): void {
    this.pageNumber = this.parseIntegerParam(params.get('PageNumber'), 1);
    this.pageSize = this.parseIntegerParam(params.get('PageSize'), 20);
    this.sortBy = params.get('SortBy') || 'Name';
    this.sortOrder = params.get('SortOrder') === 'desc' ? 'desc' : 'asc';
    this.filters = {
      Name: params.get('Name') || '', Type: params.get('Type') || '',
      Category: params.get('Category') || '', Resource: params.get('Resource') || '',
      Currency: params.get('Currency') || '', Ticker: params.get('Ticker') || '',
      FromValue: this.parseNumberParam(params.get('FromValue')),
      ToValue: this.parseNumberParam(params.get('ToValue')),
      FromLastUpdatedAt: this.parseDateParam(params.get('FromLastUpdatedAt')),
      ToLastUpdatedAt: this.parseDateParam(params.get('ToLastUpdatedAt'))
    };
  }

  private parseIntegerParam(value: string | null, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private parseNumberParam(value: string | null): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseDateParam(value: string | null): string {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : value.slice(0, 10);
  }

  private updateQueryParams(): void {
    const queryParams: Record<string, string | number | null> = {
      PageNumber: this.pageNumber, PageSize: this.pageSize, SortBy: this.sortBy, SortOrder: this.sortOrder
    };
    for (const key of ['Name', 'Type', 'Category', 'Resource', 'Currency', 'Ticker'] as const) {
      if (this.filters[key]) queryParams[key] = this.filters[key];
    }
    if (this.filters.FromValue !== null) queryParams['FromValue'] = this.filters.FromValue;
    if (this.filters.ToValue !== null) queryParams['ToValue'] = this.filters.ToValue;
    if (this.filters.FromLastUpdatedAt) queryParams['FromLastUpdatedAt'] = this.filters.FromLastUpdatedAt;
    if (this.filters.ToLastUpdatedAt) queryParams['ToLastUpdatedAt'] = this.filters.ToLastUpdatedAt;
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: '', replaceUrl: true });
  }

  load(): void {
    this.loading = true;
    this.repo.getInvestments({
      ...this.filters,
      FromLastUpdatedAt: this.filters.FromLastUpdatedAt || null,
      ToLastUpdatedAt: this.filters.ToLastUpdatedAt || null,
      PageNumber: this.pageNumber,
      PageSize: this.pageSize,
      SortBy: this.sortBy,
      SortOrder: this.sortOrder
    }).pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe({ next: result => {
        this.investments = result.items;
        this.totalItems = result.totalItems;
        this.pageNumber = result.pageNumber;
        this.pageSize = result.pageSize;
        this.totalPages = result.totalPages;
        this.error = '';
      }, error: () => { this.error = 'Não foi possível carregar os investimentos.'; } });
  }

  applyFilters(): void { this.pageNumber = 1; this.updateQueryParams(); }

  resetFilters(): void {
    this.filters = { Name: '', Type: '', Category: '', Resource: '', Currency: '', Ticker: '', FromValue: null, ToValue: null, FromLastUpdatedAt: '', ToLastUpdatedAt: '' };
    this.pageNumber = 1;
    this.pageSize = 20;
    this.sortBy = 'Name';
    this.sortOrder = 'asc';
    this.updateQueryParams();
  }

  onSortChange(): void { this.pageNumber = 1; this.updateQueryParams(); }

  sortByColumn(column: string): void {
    if (this.sortBy === column) this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    else { this.sortBy = column; this.sortOrder = 'asc'; }
    this.pageNumber = 1;
    this.updateQueryParams();
  }

  onPageSizeChange(): void { this.pageNumber = 1; this.updateQueryParams(); }

  previousPage(): void { if (this.pageNumber > 1) { this.pageNumber--; this.updateQueryParams(); } }

  nextPage(): void { if (this.pageNumber < this.totalPages) { this.pageNumber++; this.updateQueryParams(); } }

  startCreate(): void { this.editingId = null; this.form = this.emptyForm(); this.formOpen = true; }

  startEdit(item: Investment): void {
    this.editingId = item.id;
    this.form = { type: item.type === 'stock' ? 'stock' : 'other', name: item.name, category: item.category, resource: item.resource,
      currency: item.currency, ticker: item.ticker ?? '', quantity: item.quantity ?? null, initialValue: null, valuationDate: '' };
    this.formOpen = true;
  }

  cancelForm(): void { this.formOpen = false; this.editingId = null; }

  save(): void {
    if (!this.form.name.trim() || !this.form.category.trim() || !this.form.resource.trim() || !this.form.currency.trim()) return;
    if (this.form.type === 'stock' && this.form.quantity == null) {
      this.toastr.error('Informe a quantidade de ações.');
      return;
    }
    this.saving = true;
    const request: InvestmentUpsertRequest = {
      type: this.form.type, name: this.form.name.trim(), category: this.form.category.trim(), resource: this.form.resource.trim(),
      currency: this.form.currency.trim().toUpperCase(), ticker: this.form.ticker.trim() || null, quantity: this.form.quantity
    };
    if (!this.editingId && this.form.initialValue !== null) {
      request.initialValue = this.form.initialValue;
      request.valuationDate = this.form.valuationDate ? new Date(this.form.valuationDate).toISOString() : null;
    }
    const operation = this.editingId ? this.repo.updateInvestment(this.editingId, request) : this.repo.createInvestment(request);
    operation.pipe(finalize(() => { this.saving = false; this.cdr.detectChanges(); })).subscribe({
      next: () => { this.toastr.success(this.editingId ? 'Investimento atualizado.' : 'Investimento criado.'); this.cancelForm(); this.load(); },
      error: err => this.toastr.error(err?.error ?? 'Não foi possível salvar o investimento.')
    });
  }

  openSnapshot(item: Investment): void {
    this.snapshotTarget = item; this.snapshotValue = null; this.snapshotCurrency = item.currency; this.snapshotDate = '';
  }

  get snapshotTotalPreview(): number | null {
    if (this.snapshotValue === null) return null;
    return this.snapshotTarget?.type === 'stock'
      ? this.snapshotValue * (this.snapshotTarget.quantity ?? 0)
      : this.snapshotValue;
  }

  get initialTotalPreview(): number | null {
    if (this.form.initialValue === null) return null;
    return this.form.type === 'stock'
      ? this.form.initialValue * (this.form.quantity ?? 0)
      : this.form.initialValue;
  }

  saveSnapshot(): void {
    if (!this.snapshotTarget || this.snapshotValue === null || this.snapshotValue < 0 || !this.snapshotCurrency.trim()) return;
    if (this.snapshotTarget.type === 'stock' && this.snapshotTarget.quantity == null) {
      this.toastr.error('Informe a quantidade de ações antes de registrar uma avaliação.');
      return;
    }
    this.saving = true;
    this.repo.addSnapshot(this.snapshotTarget.id, { value: this.snapshotValue, currency: this.snapshotCurrency.trim().toUpperCase(),
      valuationDate: this.snapshotDate ? new Date(this.snapshotDate).toISOString() : null })
      .pipe(finalize(() => { this.saving = false; this.cdr.detectChanges(); }))
      .subscribe({ next: () => { this.toastr.success('Avaliação registrada.'); this.snapshotTarget = null; this.load(); }, error: err => this.toastr.error(err?.error ?? 'Não foi possível registrar a avaliação.') });
  }

  openHistory(item: Investment): void {
    this.historyInvestment = item; this.history = [];
    this.repo.getHistory(item.id).subscribe({ next: rows => { this.history = rows; this.cdr.detectChanges(); }, error: () => this.toastr.error('Não foi possível carregar o histórico.') });
  }

  closeHistory(): void { this.historyInvestment = null; }

  delete(item: Investment): void {
    if (!window.confirm(`Remover ${item.name} e todo o histórico?`)) return;
    this.repo.deleteInvestment(item.id).subscribe({ next: () => { this.toastr.success('Investimento removido.'); this.load(); }, error: err => this.toastr.error(err?.error ?? 'A exclusão requer permissão de administrador.') });
  }

  trackById(_index: number, item: Investment): string { return item.id; }

  getPositionValue(item: Investment): number {
    if (item.type === 'stock' && item.unitPrice != null && item.quantity != null) {
      return item.unitPrice * item.quantity;
    }
    return item.currentValue;
  }

  private emptyForm(): InvestmentForm { return { type: 'other', name: '', category: '', resource: '', currency: 'GBP', ticker: '', quantity: null, initialValue: null, valuationDate: '' }; }
}
