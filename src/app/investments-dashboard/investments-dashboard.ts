import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ToastrService } from 'ngx-toastr';
import { Investment, InvestmentCurrencySummary, InvestmentSnapshot, InvestmentSummary } from '../models/investment.model';
import { InvestmentsRepository } from '../services/investments.repository';

@Component({
  selector: 'app-investments-dashboard', standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, CurrencyPipe],
  templateUrl: './investments-dashboard.html', styleUrl: './investments-dashboard.scss'
})
export class InvestmentsDashboard implements OnInit {
  summary: InvestmentSummary = { currencies: [] };
  selectedCurrency = '';
  fromDate = '';
  toDate = '';
  loading = false;
  historyLoading = false;
  error = '';
  portfolioHistory: InvestmentSnapshot[] = [];
  investments: Investment[] = [];
  allocations: Record<'type' | 'category' | 'resource', { labels: string[]; series: number[] }> = {
    type: { labels: [], series: [] }, category: { labels: [], series: [] }, resource: { labels: [], series: [] }
  };
  allocationChartOptions: any = { chart: { type: 'donut', height: 310, toolbar: { show: false } }, legend: { position: 'bottom' }, dataLabels: { enabled: true }, tooltip: { y: { formatter: (v: number) => v.toLocaleString() } }, colors: ['#2c3e50','#c2410c','#0f766e','#7c3aed','#2563eb','#ca8a04','#db2777'] };
  historySeries: any[] = [];
  historyOptions: any = { chart: { type: 'scatter', height: 340, toolbar: { show: false }, zoom: { enabled: true } }, markers: { size: 6 }, dataLabels: { enabled: false }, xaxis: { type: 'datetime' }, yaxis: { labels: { formatter: (v: number) => v.toLocaleString() } }, tooltip: { x: { format: 'dd MMM yyyy' }, y: { formatter: (v: number) => v.toLocaleString() } }, colors: ['#256d85'] };
  positionSeries: any[] = [];
  positionOptions: any = { chart: { type: 'bar', height: 360, toolbar: { show: false } }, plotOptions: { bar: { horizontal: true, borderRadius: 5, barHeight: '65%' } }, dataLabels: { enabled: true, formatter: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 }) }, xaxis: { categories: [], labels: { formatter: (v: string) => Number(v).toLocaleString() } }, tooltip: { y: { formatter: (v: number) => v.toLocaleString() } }, colors: ['#256d85'] };

  constructor(private repo: InvestmentsRepository, private cdr: ChangeDetectorRef, private toastr: ToastrService) {}

  ngOnInit(): void { this.loadSummary(); }

  get selectedSummary(): InvestmentCurrencySummary | undefined { return this.summary.currencies.find(x => x.currency === this.selectedCurrency); }

  loadSummary(): void {
    this.loading = true;
    this.repo.getSummary().pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe({ next: summary => {
        this.summary = summary;
        if (!summary.currencies.some(c => c.currency === this.selectedCurrency)) this.selectedCurrency = summary.currencies[0]?.currency ?? '';
        this.updateAllocations();
        this.repo.getInvestments().subscribe({ next: rows => { this.investments = rows; this.rebuildSummaryFromPositions(); this.updatePositions(); this.buildHistorySeries(this.portfolioHistory); this.cdr.detectChanges(); }, error: () => this.toastr.error('Could not load individual investment positions.') });
        this.loadHistory();
      }, error: () => { this.error = 'Não foi possível carregar o resumo dos investimentos.'; } });
  }

  onCurrencyChange(): void { this.updateAllocations(); this.updatePositions(); this.loadHistory(); }

  loadHistory(): void {
    if (!this.selectedCurrency) { this.portfolioHistory = []; this.historySeries = []; return; }
    this.historyLoading = true;
    this.repo.getPortfolioHistory(this.selectedCurrency, this.fromDate || undefined, this.toDate || undefined)
      .pipe(finalize(() => { this.historyLoading = false; this.cdr.detectChanges(); }))
      .subscribe({ next: rows => { this.portfolioHistory = rows; this.buildHistorySeries(rows); }, error: err => { this.toastr.error(err?.error ?? 'Não foi possível carregar o histórico da carteira.'); } });
  }

  applyDates(): void {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) { this.toastr.error('A data inicial deve ser anterior à final.'); return; }
    this.loadHistory();
  }

  private updateAllocations(): void {
    const current = this.selectedSummary;
    this.allocations = {
      type: this.toChart(current?.byType ?? []),
      category: this.toChart(current?.byCategory ?? []),
      resource: this.toChart(current?.byResource ?? [])
    };
  }

  private updatePositions(): void {
    const positions = this.investments
      .filter(item => item.currency.toUpperCase() === this.selectedCurrency.toUpperCase())
      .sort((a, b) => this.getPositionValue(b) - this.getPositionValue(a))
      .slice(0, 10);
    this.positionOptions = { ...this.positionOptions, xaxis: { ...this.positionOptions.xaxis, categories: positions.map(item => item.name) }, tooltip: { y: { formatter: (v: number) => `${this.selectedCurrency} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` } }, dataLabels: { ...this.positionOptions.dataLabels, formatter: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 }) } };
    this.positionSeries = [{ name: `Current value (${this.selectedCurrency})`, data: positions.map(item => this.getPositionValue(item)) }];
  }

  private getPositionValue(item: Investment): number {
    if (item.type === 'stock' && item.unitPrice != null && item.quantity != null) return item.unitPrice * item.quantity;
    return item.currentValue;
  }

  private rebuildSummaryFromPositions(): void {
    const byCurrency = new Map<string, Investment[]>();
    for (const investment of this.investments) {
      const currency = investment.currency.toUpperCase();
      byCurrency.set(currency, [...(byCurrency.get(currency) ?? []), investment]);
    }
    const breakdown = (rows: Investment[], key: (investment: Investment) => string) => {
      const values = new Map<string, number>();
      for (const row of rows) {
        const group = key(row);
        values.set(group, (values.get(group) ?? 0) + this.getPositionValue(row));
      }
      return [...values.entries()].map(([groupKey, value]) => ({ key: groupKey, value })).sort((a, b) => b.value - a.value);
    };
    this.summary = { currencies: [...byCurrency.entries()].map(([currency, rows]) => ({
      currency,
      totalValue: rows.reduce((total, row) => total + this.getPositionValue(row), 0),
      byType: breakdown(rows, row => row.type),
      byCategory: breakdown(rows, row => row.category),
      byResource: breakdown(rows, row => row.resource)
    })).sort((a, b) => a.currency.localeCompare(b.currency)) };
    if (!this.summary.currencies.some(c => c.currency === this.selectedCurrency)) this.selectedCurrency = this.summary.currencies[0]?.currency ?? '';
    this.updateAllocations();
  }

  private toChart(rows: { key: string; value: number }[]): { labels: string[]; series: number[] } {
    return { labels: rows.map(row => row.key), series: rows.map(row => row.value) };
  }

  private buildHistorySeries(rows: InvestmentSnapshot[]): void {
    const grouped = new Map<string, InvestmentSnapshot[]>();
    for (const row of rows) grouped.set(row.investmentId, [...(grouped.get(row.investmentId) ?? []), row]);
    this.historySeries = [...grouped.entries()].map(([investmentId, snapshots]) => {
      const investmentName = this.investments.find(item => item.id === investmentId)?.name ?? 'Investment';
      return { name: investmentName, data: snapshots.map(row => ({ x: new Date(row.recordedAt).getTime(), y: row.value })).sort((a, b) => a.x - b.x) };
    });
  }
}
