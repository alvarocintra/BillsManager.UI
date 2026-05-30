import { ChangeDetectorRef, Component, Input, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
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
          *ngIf="chartData.labels && chartData.labels.length > 0"
          baseChart
          [data]="chartData"
          [type]="chartType"
          [options]="chartOptions"
          [legend]="legend">
        </canvas>
        <div *ngIf="!chartData.labels || !chartData.datasets || chartData.labels.length === 0 || chartData.datasets.length === 0" class="no-data">
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
export class ChartComponent implements OnChanges {
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && this.chart) {
      console.log('Chart data changed, updating...', this.chartData);
      setTimeout(() => {
        this.chart?.update();
        this.cdr.detectChanges();
      }, 0);
    }
  }
}