import { Component, Input, OnChanges, SimpleChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent as ApexChartComponent } from 'ng-apexcharts';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="chart-shell" [class.is-expanded]="isExpanded">
      <div class="card chart-card">
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
          <div *ngIf="hasChartData" class="apex-wrapper">
            <apx-chart
              #apexChart
              [series]="apexSeries"
              [chart]="apexOptions.chart"
              [xaxis]="apexOptions.xaxis"
              [yaxis]="apexOptions.yaxis"
              [colors]="apexOptions.colors"
              [stroke]="apexOptions.stroke"
              [fill]="apexOptions.fill"
              [plotOptions]="apexOptions.plotOptions"
              [legend]="apexOptions.legend"
              [tooltip]="apexOptions.tooltip"
              [labels]="apexOptions.labels"
              [dataLabels]="apexOptions.dataLabels">
            </apx-chart>
          </div>
          <div *ngIf="!hasChartData" class="no-data">
            No data available
          </div>
        </div>
      </div>

      <div *ngIf="isExpanded" class="chart-backdrop" (click)="closeExpanded()"></div>
    </div>
  `,
styles: [`
    :host { display: block; }
    .chart-shell { position: relative; }
    .chart-card {
      position: relative;
      z-index: 1;
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
    }
    
    /* Quando maximizado, o card ocupa quase a tela toda */
    .chart-shell.is-expanded .chart-card {
      position: fixed;
      inset: 20px;
      z-index: 1001;
      margin: 0;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      height: calc(100vh - 40px); /* Garante que o CARD se estique com base na tela */
    }
    
    .chart-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
    }
    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
      height: 40px; /* Altura fixa para o cabeçalho mapeado */
    }
    .chart-header h2 { margin: 0; font-size: 1.1rem; color: #1e293b; font-weight: 600; }
    
    /* Configuração reativa do corpo do gráfico */
    .chart-body { display: block; height: 350px; }
    
    /* Aqui está o segredo: O corpo passa a ocupar 100% do espaço restante do card flex */
    .chart-shell.is-expanded .chart-body { 
      flex: 1; 
      height: 100% !important; 
      min-height: 0; 
    }
    
    .apex-wrapper { width: 100%; height: 100%; }
    
    /* Força o SVG do ApexCharts a preencher o espaço dinâmico gerado pelo Flexbox */
    ::ng-deep .chart-shell.is-expanded apx-chart,
    ::ng-deep .chart-shell.is-expanded .apexcharts-canvas,
    ::ng-deep .chart-shell.is-expanded .apexcharts-canvas svg {
      height: 100% !important;
      width: 100% !important;
    }

    .expand-button {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #334155;
      border-radius: 999px;
      padding: 0.45rem 0.85rem;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .expand-button:hover { background: #f1f5f9; border-color: #cbd5e1; transform: translateY(-1px); }
    .no-data {
      padding: 50px;
      text-align: center;
      color: #94a3b8;
      background: #f8fafc;
      border-radius: 8px;
      line-height: 250px;
    }
  `]
})
export class ChartComponent implements OnChanges {
  @ViewChild('apexChart') chartInstance!: ApexChartComponent;

  @Input() chartTitle: string = 'Chart';
  @Input() chartType: string = 'bar';
  @Input() chartData: any; 
  @Input() chartOptions: any;

  // Opções de customização reativas
  @Input() showDataLabels: boolean = true; 
  @Input() decimalPlaces: number = 2;       
  @Input() showLegend: boolean = true; // <-- NOVO: Permite ocultar/mostrar a legenda do gráfico

  isExpanded = false;
  apexSeries: any[] = [];
  apexOptions: any = {};

  constructor(private cdr: ChangeDetectorRef) {}

  get hasChartData(): boolean {
    return Array.isArray(this.chartData?.labels) && this.chartData.labels.length > 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['chartData'] || 
      changes['chartType'] || 
      changes['showDataLabels'] || 
      changes['decimalPlaces'] ||
      changes['showLegend']
    ) {
      this.adaptChartData();
    }
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.updateLayout();
  }

  closeExpanded(): void {
    this.isExpanded = false;
    this.updateLayout();
  }

  private updateLayout(): void {
    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.chartInstance) {
        let targetHeight: string | number = 350;

        if (this.isExpanded) {
          // Captura a altura real da janela do navegador
          const windowHeight = window.innerHeight;
          // Subtrai o espaço dos componentes (margens do card + header + paddings)
          // 40px (inset do card) + 40px (paddings do card) + 40px (header) + 20px (margem de segurança) = ~140px
          targetHeight = windowHeight - 140; 
        }

        // Força a atualização com o valor exato em pixels calculado para a tela atual
        this.chartInstance.updateOptions({
          chart: {
            height: targetHeight
          }
        }, false, false);

        // Notifica o core do ApexCharts para reajustar o Grid e os eixos
        const nativeChart = (this.chartInstance as any).chartObj;
        if (nativeChart && typeof nativeChart.windowResize === 'function') {
          nativeChart.windowResize();
        }
      }
      this.cdr.detectChanges();
    }, 60); // Pequeno fôlego para o navegador aplicar a classe CSS '.is-expanded'
  }

  private adaptChartData(): void {
    if (!this.hasChartData) return;

    const labels = this.chartData.labels;
    const datasets = this.chartData.datasets || [];
    
    let typeMap: any = this.chartType;
    if (this.chartType === 'doughnut' || this.chartType === 'pie') typeMap = 'donut';

    const decimals = this.decimalPlaces;
    const isCircular = typeMap === 'donut';

    this.apexOptions = {
      chart: {
        type: typeMap,
        height: this.isExpanded ? '100%' : 350,
        fontFamily: 'inherit',
        toolbar: { show: this.isExpanded },
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
        animations: { enabled: true, easing: 'easeinout', speed: 400 }
      },
      // CORREÇÃO: DataLabels inteligentes separados por tipo de gráfico
      dataLabels: {
        enabled: this.showDataLabels,
        style: { colors: isCircular ? ['#fff'] : ['#fff', '#333'] },
        formatter: (val: number, opts: any) => {
          if (isCircular) {
            // Para Donut/Pie, o Apex passa a porcentagem calculada em 'val'. Mostra ex: "45.2%"
            return `${val.toFixed(1)}%`;
          }
          // Para barras/linhas, mostra o valor financeiro configurado
          return `£${val.toLocaleString('en-US', { 
            minimumFractionDigits: decimals, 
            maximumFractionDigits: decimals 
          })}`;
        }
      },
      // Legenda controlada dinamicamente via @Input
      legend: { 
        show: this.showLegend, 
        position: 'top' 
      },
      stroke: {
        show: true,
        width: this.chartType === 'line' ? 3 : (isCircular ? 2 : 0),
        curve: 'smooth'
      },
      plotOptions: isCircular ? {
        pie: {
          donut: { size: '65%' },
          customScale: 1
        }
      } : {},
      yaxis: {
        show: !isCircular, // Donut não usa eixo Y estrutural
        labels: {
          formatter: (val: number) => {
            return `£${val.toLocaleString('en-US', { 
              minimumFractionDigits: decimals, 
              maximumFractionDigits: decimals 
            })}`;
          }
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => {
            // No tooltip do Donut, queremos ver o valor real em dinheiro, não a porcentagem
            return `£${val.toLocaleString('en-US', { 
              minimumFractionDigits: decimals, 
              maximumFractionDigits: decimals 
            })}`;
          }
        }
      }
    };

    if (isCircular) {
      this.apexSeries = datasets[0]?.data || [];
      this.apexOptions.labels = labels;
      this.apexOptions.colors = datasets[0]?.backgroundColor || [];
    } else {
      this.apexSeries = datasets.map((ds: any) => ({
        name: ds.label || '',
        data: ds.data || []
      }));

      this.apexOptions.xaxis = { categories: labels };
      this.apexOptions.colors = datasets.map((ds: any) => ds.backgroundColor || '#42a5f5');

      if (this.chartType === 'line') {
        this.apexOptions.fill = { type: 'solid' };
      } else if (!this.chartOptions?.scales?.x?.stacked) {
        this.apexOptions.fill = {
          type: 'gradient',
          gradient: { shade: 'light', type: 'vertical', opacityFrom: 0.85, opacityTo: 0.55 }
        };
      }
      
      if (this.chartOptions?.scales?.x?.stacked) {
        this.apexOptions.chart.stacked = true;
        this.apexOptions.plotOptions = { bar: { horizontal: false, columnWidth: '55%' } };
      }
    }
  }
}
