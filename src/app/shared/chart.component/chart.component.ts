import { AfterViewInit, ChangeDetectorRef, Component, Input, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="chart-container">
      <h2>{{ chartTitle }}</h2>
      <div style="display: block; min-height: 400px;">
        <canvas
          *ngIf="hasChartData"
          baseChart
          [data]="chartData"
          [type]="chartType"
          [options]="chartOptions"
          [height]="300"
          [legend]="legend">
        </canvas>
        <div *ngIf="!hasChartData" class="no-data">
          No data available
        </div>
      </div>
    </div>
  `,
  styles: [`
    .no-data {
      padding: 50px;
      text-align: center;
      color: #999;
      background: #f5f5f5;
      border-radius: 8px;
    }
  `]
})
export class ChartComponent implements OnChanges, AfterViewInit {
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
          text: 'Amount (£)'
        }
      }
    }
  };
  @Input() legend: boolean = true;

  constructor(private cdr: ChangeDetectorRef) {}

  get hasChartData(): boolean {
    return Array.isArray(this.chartData?.labels) &&
      this.chartData.labels.length > 0 &&
      Array.isArray(this.chartData?.datasets) &&
      this.chartData.datasets.length > 0;
  }

  ngAfterViewInit(): void {
    this.scheduleChartRefresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData']) {
      this.scheduleChartRefresh();
    }
  }

  private scheduleChartRefresh(): void {
    setTimeout(() => {
      this.chart?.update();
      this.cdr.detectChanges();
    }, 0);
  }
}
