import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ChartComponent } from "../shared/chart.component/chart.component";
import { BillsRepository } from '../services/bills.repository';
import { finalize } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';
import { Bill } from '../models/bill.model';
import { BillsFilter } from '../models/bills-filter.model';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  imports: [ChartComponent, FontAwesomeModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // Adicione esta linha
})
export class Dashboard implements OnInit {
  bills: Bill[] = [];
  totalItems = 0;
  currentPage = 1;
  pageSize = 1000;
  filters: BillsFilter = {
    title: '',
    paid: '',
    category: '',
    fromDueDate: undefined,
    toDueDate: undefined,
    fromAmount: undefined,
    toAmount: undefined
  };

  sortColumn: string = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  faChartBar = faChartBar;

  chartDataTotalPerCategory: any = {
    labels: [],
    datasets: []
  };
  chartDataTotalPerMonth: any = {
    labels: [],
    datasets: []
  };
  chartBillsPerMonth: any = {
    labels: [],
    datasets: [
      {
        label: 'Bills per Month',
        data: [],
        backgroundColor: '#42a5f5'
      }
    ]
  };
  chartBillsPerCategory: any = {
    labels: [],
    datasets: [
      {
        label: 'Bills per Category',
        data: [],
        backgroundColor: '#66bb6a'
      }
    ]
  };
  
  chartDataStackedByMonth: ChartData = {
    labels: [],
    datasets: []
  };

  // NOVO: Opções para o gráfico stacked (com suporte a stacking)
  stackedBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (£)'
        },
        ticks: {
          callback: (value: any) => '£' + value.toLocaleString()
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: £${value.toLocaleString()}`;
          }
        }
      },
      legend: {
        position: 'top',
      }
    }
  };

  testWithMockData() {
  setTimeout(() => {
    this.chartDataStackedByMonth = {
      labels: ['Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025'],
      datasets: [
        {
          label: 'Entreterimento',
          data: [50, 60, 45, 70, 55],
          backgroundColor: '#ffa726',
          stack: 'stack-1'
        },
        {
          label: 'Food',
          data: [200, 180, 220, 190, 210],
          backgroundColor: '#66bb6a',
          stack: 'stack-1'
        },
        {
          label: 'Transport',
          data: [80, 90, 75, 85, 95],
          backgroundColor: '#42a5f5',
          stack: 'stack-1'
        }
      ]
    };
    this.cdr.detectChanges();
    console.log('Mock data set:', this.chartDataStackedByMonth);
  }, 1000);
  }

  constructor(
    private billsRepository: BillsRepository,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    //this.testWithMockData();
    this.getBills();
  }

  getBills() {
    this.billsRepository.getBills(
      this.currentPage,
      this.pageSize,
      this.filters.title,
      this.filters.type,
      this.filters.category,
      this.filters.paid,
      this.filters.fromDueDate,
      this.filters.toDueDate,
      this.filters.fromAmount,
      this.filters.toAmount,
      this.sortColumn,
      this.sortDirection
    )
      .pipe(finalize(() => this.cdr.detectChanges()))
      .subscribe({
        next: (result) => {
          this.bills = result.items;
          this.setChartDataTotalPerCategory();
          this.setChartDataTotalPerMonth();
          this.setStackedBarChartData();
          this.getBillsPerMonth();
          this.getBillsPerCategory();
          this.cdr.detectChanges();
          this.debugBillsData();
        },
        error: (err) => {
          console.error('Error loading bills:', err);
        }
      });
  }

  // Método auxiliar para gerar cores consistentes por categoria
  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Outros': '#9e9e9e',
      'Comida': '#66bb6a',
      'Transporte': '#bb3006',
      'Entreterimento': '#09c2eb',
      'Contas fixas': '#282cff',
      'Compras': '#3cff00',
      'Mercado': '#06ac00',
      'Educacao': '#ff7043',
      'Salario': '#4caf50',
      'Restaurantes': '#4cd074',
      'Viagens': '#ff8400'
    };
    
    if (colors[category]) {
      return colors[category];
    }
    
    // Gerar cor baseada no hash da string
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
      return `hsl(${hue}, 70%, 60%)`;
    }

  setStackedBarChartData() {
    const expenses = this.bills.filter(bill => bill.type === 'expense');
    
    if (expenses.length === 0) {
      this.chartDataStackedByMonth = {
        labels: [],
        datasets: []
      };
      return;
    }
    
    // Agrupar por mês e categoria
    const monthlyData: { [month: string]: { [category: string]: number } } = {};
    
    for (const bill of expenses) {
      const date = new Date(bill.dueDate);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      const category = bill.category?.name || 'Uncategorized';
      const amount = bill.amount;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {};
      }
      
      if (!monthlyData[monthYear][category]) {
        monthlyData[monthYear][category] = 0;
      }
      
      monthlyData[monthYear][category] += amount;
    }
    
    // Ordenar meses
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Pegar todas as categorias
    const allCategories = new Set<string>();
    for (const month of sortedMonths) {
      Object.keys(monthlyData[month]).forEach(cat => allCategories.add(cat));
    }
    
    const sortedCategories = Array.from(allCategories).sort();
    
    // Criar datasets
    const datasets = sortedCategories.map(category => ({
      label: category,
      data: sortedMonths.map(month => monthlyData[month][category] || 0),
      backgroundColor: this.getCategoryColor(category),
      stack: 'stack-1'
    }));
    
    this.chartDataStackedByMonth = {
      labels: sortedMonths,
      datasets: datasets
    };
    
    this.cdr.detectChanges();
  }

// 2. TOTAL PER CATEGORY (CORRIGIDO)
setChartDataTotalPerCategory() {
  const categoryTotals: Record<string, number> = {};

  for (const bill of this.bills) {
    const catName = bill.category?.name ?? 'Uncategorized';
    if (bill.type === 'income') {
      categoryTotals[catName] = (categoryTotals[catName] || 0) + bill.amount;
    } else if (bill.type === 'expense') {
      categoryTotals[catName] = (categoryTotals[catName] || 0) - bill.amount;
    }
  }

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  
  this.chartDataTotalPerCategory = {
    labels: labels,
    datasets: [{
      label: 'Total Amount',
      data: data,
      backgroundColor: '#42a5f5',
      borderColor: '#42a5f5',
      borderWidth: 1
    }]
  };
  
  this.cdr.detectChanges();
}

// 3. TOTAL PER MONTH (CORRIGIDO)
setChartDataTotalPerMonth() {
  const monthTotals: Record<string, number> = {};

  for (const bill of this.bills) {
    const date = new Date(bill.dueDate);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const monthYear = `${month} ${year}`;
    
    if (bill.type === 'income') {
      monthTotals[monthYear] = (monthTotals[monthYear] || 0) + bill.amount;
    } else if (bill.type === 'expense') {
      monthTotals[monthYear] = (monthTotals[monthYear] || 0) - bill.amount;
    }
  }

  // Ordenar meses
  const sortedMonths = Object.keys(monthTotals).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });
  
  const data = sortedMonths.map(month => monthTotals[month]);
  
  this.chartDataTotalPerMonth = {
    labels: sortedMonths,
    datasets: [{
      label: 'Total Amount',
      data: data,
      backgroundColor: '#66bb6a',
      borderColor: '#66bb6a',
      borderWidth: 2,
      fill: false,
      tension: 0.4
    }]
  };
  
  this.cdr.detectChanges();
}

// 4. BILLS PER MONTH (CORRIGIDO)
getBillsPerMonth() {
  const monthCounts: Record<string, number> = {};

  for (const bill of this.bills) {
    const date = new Date(bill.dueDate);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const monthYear = `${month} ${year}`;
    monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
  }

  // Ordenar meses
  const sortedMonths = Object.keys(monthCounts).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });
  
  const data = sortedMonths.map(month => monthCounts[month]);
  
  this.chartBillsPerMonth = {
    labels: sortedMonths,
    datasets: [{
      label: 'Bills per Month',
      data: data,
      backgroundColor: '#42a5f5',
      borderColor: '#42a5f5',
      borderWidth: 2,
      fill: false,
      tension: 0.4
    }]
  };
  
  this.cdr.detectChanges();
}

// 5. BILLS PER CATEGORY (CORRIGIDO)
getBillsPerCategory() {
  const categoryCounts: Record<string, number> = {};

  for (const bill of this.bills) {
    const catName = bill.category?.name ?? 'Uncategorized';
    categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
  }

  const labels = Object.keys(categoryCounts);
  const data = Object.values(categoryCounts);
  
  this.chartBillsPerCategory = {
    labels: labels,
    datasets: [{
      label: 'Bills per Category',
      data: data,
      backgroundColor: '#66bb6a',
      borderColor: '#66bb6a',
      borderWidth: 1
    }]
  };
  
  this.cdr.detectChanges();
}

  debugBillsData() {
    console.log('=== DEBUG BILLS DATA ===');
    console.log('Total bills:', this.bills.length);
    
    const expenses = this.bills.filter(bill => bill.type === 'expense');
    console.log('Expenses:', expenses.length);
    console.log('Incomes:', this.bills.filter(bill => bill.type === 'income').length);
    
    if (expenses.length > 0) {
      console.log('First expense example:', expenses[0]);
      console.log('Expense categories:', [...new Set(expenses.map(b => b.category?.name))]);
      console.log('Expense dates:', expenses.map(b => new Date(b.dueDate).toLocaleString('default', { month: 'short', year: 'numeric' })));
    } else {
      console.warn('No expenses found! Check if bills have type="expense"');
    }
  }
}
