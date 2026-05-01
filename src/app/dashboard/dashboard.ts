import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ChartComponent } from "../shared/chart.component/chart.component";
import { BillsRepository } from '../services/bills.repository';
import { finalize } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';
import { Bill } from '../models/bill.model';
import { BillsFilter } from '../models/bills-filter.model';

@Component({
  selector: 'app-dashboard',
  imports: [ChartComponent, FontAwesomeModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
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

  constructor(
    private billsRepository: BillsRepository,
    private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getBills();
  }

  getBills() {
    this.billsRepository.getBills(
      this.currentPage,
      this.pageSize,
      this.filters.title,
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
          this.getBillsPerMonth();
          this.getBillsPerCategory();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading bills:', err);
        }
      });
  }

  setChartDataTotalPerCategory() {
    const categoryTotals: Record<string, number> = {};

    // Sum amounts by category
    for (const bill of this.bills) {
      const catName = bill.category?.name ?? 'Uncategorized';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + bill.amount;
    }

    this.chartDataTotalPerCategory.labels = Object.keys(categoryTotals);
    this.chartDataTotalPerCategory.datasets = [
      {
        label: 'Total Amount',
        data: Object.values(categoryTotals),
        backgroundColor: '#42a5f5'
      }
    ];
    this.cdr.detectChanges();
  }

  setChartDataTotalPerMonth() {
    const monthTotals: Record<string, number> = {};

    // Sum amounts by month
    for (const bill of this.bills) {
      const month = new Date(bill.dueDate).toLocaleString('default', { month: 'long' });
      monthTotals[month] = (monthTotals[month] || 0) + bill.amount;
    }

    this.chartDataTotalPerMonth.labels = Object.keys(monthTotals);
    this.chartDataTotalPerMonth.datasets = [
      {
        label: 'Total Amount',
        data: Object.values(monthTotals),
        backgroundColor: '#66bb6a'
      }
    ];
    this.cdr.detectChanges();
  }

  getBillsPerMonth() {
    const monthCounts: Record<string, number> = {};

    // Count bills by month
    for (const bill of this.bills) {
      const month = new Date(bill.dueDate).toLocaleString('default', { month: 'long' });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    }

    this.chartBillsPerMonth.labels = Object.keys(monthCounts);
    this.chartBillsPerMonth.datasets[0].data = Object.values(monthCounts);
    this.cdr.detectChanges();
  }

  getBillsPerCategory() {
    const categoryCounts: Record<string, number> = {};

    // Count bills by category
    for (const bill of this.bills) {
      const catName = bill.category?.name ?? 'Uncategorized';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
    }

    this.chartBillsPerCategory.labels = Object.keys(categoryCounts);
    this.chartBillsPerCategory.datasets[0].data = Object.values(categoryCounts);
    this.cdr.detectChanges();
  }
}
