import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
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
      <button (click)="chart?.update()">Update Chart</button>
      <button (click)="chart?.render()">Render Chart</button>
    <div style="display: block;">
      <canvas baseChart
              [data]="chartData"
              [type]="chartType"
              [options]="chartOptions"
              [legend]="legend">
      </canvas>
    </div>
  `,
})
export class ChartComponent {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  @Input() chartTitle: string = 'Chart';
  @Input() chartType: ChartType = 'bar';
  @Input() chartData!: ChartData;
  @Input() chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: { beginAtZero: true }
    }
  };
  @Input() legend: boolean = true;
}
