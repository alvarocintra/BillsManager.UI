import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ChartComponent } from "../shared/chart.component/chart.component";
import { BillsRepository } from '../services/bills.repository';
import { finalize } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown, faArrowUp, faBullseye, faChartBar, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { Bill } from '../models/bill.model';
import { BillsFilter } from '../models/bills-filter.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ChartComponent, FontAwesomeModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush // Adicione esta linha
})
export class Dashboard implements OnInit {
  bills: Bill[] = [];
  totalItems = 0;
  currentPage = 1;
  pageSize = 9999999;
  balance = 0;
  savingsGoal = 50000.00;
  startingBalance = 0;
  economyProgressPercentage = 0;
  totalRevenue = 0;
  totalExpenses = 0;

  filters: BillsFilter = {
    title: '',
    paid: '',
    category: '',
    fromDueDate: undefined,
    toDueDate: undefined,
    fromAmount: undefined,
    toAmount: undefined
  };

  sortColumn: string = 'dueDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  faChartBar = faChartBar;
  faMoneyBill = faMoneyBill;
  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  faBullseye = faBullseye;

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

  chartDataStackedByMonth: any = {
    labels: [],
    datasets: []
  };

  stackedBarOptions: any = {
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

  chartDataIncomeVsExpense: any = {
    labels: [],
    datasets: [
      // Dataset para Renda
      {
        label: 'Income',
        data: [],
        backgroundColor: '#4caf50' // Cor verde
      },
      // Dataset para Despesa
      {
        label: 'Expense',
        data: [],
        backgroundColor: '#bb3006' // Cor vermelha/laranja
      }
    ]
  };

  chartDataExpenseDistribution: any = {
    labels: [],
    datasets: []
  };

  chartDataMoMExpenses: any = {
    labels: [],
    datasets: []
  };
  Math: any;

  constructor(
    private billsRepository: BillsRepository,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService) { }

  ngOnInit(): void {
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
          this.setupDashboardData();
          this.setChartDataTotalPerCategory();
          this.setChartDataTotalPerMonth();
          this.setStackedBarChartData();
          this.setIncomeVsExpenseChartData();
          this.setExpenseDistributionChartData();
          this.setMoMChartData();
          this.getBillsPerMonth();
          this.getBillsPerCategory();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toastr.error('Error loading bills.', 'Error');
        }
      });
  }

  setupDashboardData(): void {
    const revenue: number = this.bills.filter(bill => bill.type === 'income').reduce((sum, bill) => sum + bill.amount, 0);
    const spent: number = this.bills.filter(bill => bill.type === 'expense').reduce((sum, bill) => sum + bill.amount, 0);

    this.totalRevenue = revenue;
    this.totalExpenses = spent;
    
    this.balance = revenue - spent;
    
    this.economyProgressPercentage = Math.min(100, (this.balance / this.savingsGoal) * 100);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
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

  setChartDataTotalPerCategory() {
    const categoryTotals: Record<string, number> = {};

    for (const bill of this.bills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())) {
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

  getBillsPerMonth() {
    const monthCounts: Record<string, number> = {};

    for (const bill of this.bills) {
      const date = new Date(bill.dueDate);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthYear = `${month} ${year}`;
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    }

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

  setIncomeVsExpenseChartData() {
    const monthlyTotals: { [monthYear: string]: { income: number; expense: number; count: number; } } = {};

    for (const bill of this.bills) {
      const date = new Date(bill.dueDate);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const monthYear = `${month} ${year}`;

      if (!monthlyTotals[monthYear]) {
        monthlyTotals[monthYear] = { income: 0, expense: 0, count: 0 };
      }

      let amountValue = Math.abs(bill.amount);

      if (bill.type === 'income') {
        monthlyTotals[monthYear].income += amountValue;
      } else {
        monthlyTotals[monthYear].expense += amountValue;
      }

      // Contagem de transações
      monthlyTotals[monthYear].count += 1;
    }

    const sortedMonths = Object.keys(monthlyTotals).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    // Montar os dados
    const incomes = sortedMonths.map(monthYear => monthlyTotals[monthYear].income);
    const expenses = sortedMonths.map(monthYear => monthlyTotals[monthYear].expense);

    this.chartDataIncomeVsExpense = {
      labels: sortedMonths,
      datasets: [
        {
          label: 'Income',
          data: incomes,
          backgroundColor: '#4caf50'
        },
        {
          label: 'Expense',
          data: expenses,
          backgroundColor: '#bb3006'
        }
      ]
    };

    this.cdr.detectChanges();
  }

  /**
 * Calcula a distribuição percentual de todas as despesas por categoria.
 * Ideal para um gráfico de Pizza/Doughnut Chart.
 */
  setExpenseDistributionChartData() {
    const categoryTotals: Record<string, number> = {};

    // 1. Somar os valores por categoria
    for (const bill of this.bills) {
      // Filtra APENAS despesas
      if (bill.type === 'expense') {
        const catName = bill.category?.name ?? 'Uncategorized';
        // Usamos Math.abs() porque o valor na bill pode vir negativo,
        // mas queremos o valor positivo gasto.
        const amount = Math.abs(bill.amount);

        categoryTotals[catName] = (categoryTotals[catName] || 0) + amount;
      }
    }

    // 2. Preparar os dados para o Chart.js
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // 3. Criar o dataset único (característico de Pie/Doughnut)
    const datasets = [{
      label: 'Total Spending',
      data: data,
      backgroundColor: labels.map(category => this.getCategoryColor(category)), // Usando a cor existente
      hoverOffset: 4
    }];

    this.chartDataExpenseDistribution = {
      labels: labels,
      datasets: datasets
    };

    this.cdr.detectChanges();
  }

  setMoMChartData() {
    // Estrutura para guardar os totais de despesas por mês
    const monthlyExpenseTotals: Record<string, number> = {};

    // 1. Agrupar o total de despesas por mês
    for (const bill of this.bills) {
      if (bill.type === 'expense') {
        const date = new Date(bill.dueDate);
        // Usamos um formato consistente para as chaves
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const monthYear = `${month} ${year}`;

        // Usamos o valor absoluto, pois queremos o gasto total
        const amount = Math.abs(bill.amount);

        monthlyExpenseTotals[monthYear] = (monthlyExpenseTotals[monthYear] || 0) + amount;
      }
    }

    // 2. Ordenar os meses cronologicamente
    // É crucial que a ordem seja correta (Jul, Ago, Set, etc.)
    const sortedMonths = Object.keys(monthlyExpenseTotals).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });


    const labels = [];
    const currentMonthData = [];
    const previousMonthData = [];

    let previousMonthTotal = 0;

    // 3. Iterar pelos meses ordenados para fazer a comparação
    for (let i = 0; i < sortedMonths.length; i++) {
      const monthYear = sortedMonths[i];
      const currentMonthTotal = monthlyExpenseTotals[monthYear];

      // Adicionar o Label (ex: Julho 2024)
      labels.push(monthYear);

      // Apenas o primeiro mês terá dados de 'Previous' como 0
      const prevValue = i > 0 ? monthlyExpenseTotals[sortedMonths[i - 1]] : 0;

      // Armazenar os dados no formato [Current, Previous]
      currentMonthData.push(currentMonthTotal);
      previousMonthData.push(prevValue);
    }

    // 4. Montar o dataset
    this.chartDataMoMExpenses = {
        labels: labels, // Ex: ['Julho 2024', 'Agosto 2024', 'Setembro 2024']
        datasets: [
            {
                label: 'Current Month Expense',
                data: currentMonthData, // [Valor Jul, Valor Ago, Valor Set]
                backgroundColor: '#bb3006',
                type: 'bar'
            },
            {
                label: 'Previous Month Expense',
                data: previousMonthData, // [Valor Zero, Valor Jul, Valor Ago]
                backgroundColor: '#9c27b0', // Use uma cor de destaque diferente (Ex: Roxo)
                type: 'bar'
            }
        ]
    };
  }
}
