import { AfterViewInit, ChangeDetectorRef, Component, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-shell" [class.is-expanded]="isExpanded">
      <div class="chart-card">
        <div class="chart-header">
          <h2>{{ chartTitle }}</h2>
          <button
            *ngIf="hasChartData"
            type="button"
            class="expand-button"
            (click)="toggleExpanded()">
            {{ isExpanded ? 'Minimize' : 'Maximize' }}
          </button>
        </div>

        <div class="chart-body">
          <canvas
            *ngIf="hasChartData"
            baseChart
            [data]="chartData"
            [type]="chartType"
            [options]="effectiveChartOptions"
            [height]="isExpanded ? 720 : 300"
            [legend]="legend">
          </canvas>
          <div *ngIf="!hasChartData" class="no-data">
            No data available
          </div>
        </div>
      </div>

      <div *ngIf="isExpanded" class="chart-backdrop" (click)="closeExpanded()"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .chart-shell {
      position: relative;
    }

    .chart-card {
      position: relative;
      z-index: 1;
      background: #fff;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
    }

    .chart-shell.is-expanded .chart-card {
      position: fixed;
      inset: 0;
      z-index: 1001;
      margin: 0;
      border-radius: 0;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      padding: 1.25rem;
    }

    .chart-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(2px);
    }

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .chart-header h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .chart-body {
      display: block;
      min-height: 400px;
    }

    .chart-shell.is-expanded .chart-body {
      flex: 1;
      min-height: 0;
    }

    .chart-shell.is-expanded canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
    }

    .expand-button {
      border: 1px solid #d0d7de;
      background: #f8fafc;
      color: #1f2937;
      border-radius: 999px;
      padding: 0.55rem 0.9rem;
      cursor: pointer;
      font-size: 0.9rem;
      line-height: 1;
      transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
      flex-shrink: 0;
    }

    .expand-button:hover {
      background: #eef2f7;
      border-color: #aeb8c2;
      transform: translateY(-1px);
    }

    .no-data {
      padding: 50px;
      text-align: center;
      color: #999;
      background: #f5f5f5;
      border-radius: 8px;
    }
  `]
})
export class ChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  @Input() chartTitle: string = 'Chart';
  @Input() chartType: ChartType = 'bar';
  @Input() chartData!: ChartData;
  @Input() chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {},
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (Â£)'
        }
      }
    }
  };
  @Input() legend: boolean = true;

  isExpanded = false;

  constructor(private cdr: ChangeDetectorRef) {}

  get hasChartData(): boolean {
    return Array.isArray(this.chartData?.labels) &&
      this.chartData.labels.length > 0 &&
      Array.isArray(this.chartData?.datasets) &&
      this.chartData.datasets.length > 0;
  }

  get effectiveChartOptions(): ChartConfiguration['options'] {
    if (!this.isExpanded) {
      return this.chartOptions;
    }

    return {
      ...this.chartOptions,
      responsive: true,
      maintainAspectRatio: false
    };
  }

  ngAfterViewInit(): void {
    this.scheduleChartRefresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData']) {
      this.scheduleChartRefresh();
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handleKeydown);
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;

    if (this.isExpanded) {
      document.addEventListener('keydown', this.handleKeydown);
    } else {
      document.removeEventListener('keydown', this.handleKeydown);
    }

    this.cdr.detectChanges();
    this.scheduleChartRefresh();
  }

  closeExpanded(): void {
    if (!this.isExpanded) {
      return;
    }

    this.isExpanded = false;
    document.removeEventListener('keydown', this.handleKeydown);
    this.cdr.detectChanges();
    this.scheduleChartRefresh();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleChartRefresh();
  }

  private scheduleChartRefresh(): void {
    setTimeout(() => {
      this.chart?.update();
      this.cdr.detectChanges();
    }, 0);
  }

  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.closeExpanded();
    }
  };
}
