import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { BillsRepository } from '../services/bills.repository';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash, faEye, faMoneyBills, faChevronRight, faChevronLeft, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Bill } from '../models/bill.model';
import { FormsModule } from '@angular/forms';
import { Category } from '../models/category.model';
import { CategoriesRepository } from '../services/categories.repository';
import { BillsFilter } from '../models/bills-filter.model';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-bills',
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './bills.html',
  styleUrl: './bills.scss'
})
export class Bills implements OnInit {
  bills: Bill[] = [];
  categories: Category[] = [];

  faPlus = faPlus;
  faTrash = faTrash;
  faEye = faEye;
  faMoneyBills = faMoneyBills;
  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faChevronUp = faChevronUp;
  faChevronDown = faChevronDown;

  totalItems = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages: number = 0;
  filters: BillsFilter = {
    title: '',
    type: '',
    paid: '',
    category: '',
    fromDueDate: undefined,
    toDueDate: undefined,
    fromCreatedAt: undefined,
    toCreatedAt: undefined,
    fromAmount: undefined,
    toAmount: undefined
  };

  sortColumn: string = 'dueDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private repo: BillsRepository,
    private categoriesRepo: CategoriesRepository,
    private router: Router,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService) {
  }

  ngOnInit(): void {
    this.loadCategories();

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.syncStateFromQueryParams(params);
        this.loadBills();
      });
  }

  private syncStateFromQueryParams(params: ParamMap): void {
    this.currentPage = this.parseNumberParam(params.get('page'), 1) ?? 1;
    this.pageSize = this.parseNumberParam(params.get('pageSize'), 10) ?? 10;
    this.sortColumn = params.get('sortColumn') || 'dueDate';
    this.sortDirection = params.get('sortDirection') === 'asc' ? 'asc' : 'desc';

    this.filters.title = params.get('title') || '';
    this.filters.type = params.get('type') || '';
    this.filters.paid = params.get('paid') || '';
    this.filters.category = params.get('category') || '';
    this.filters.fromDueDate = this.parseDateParam(params.get('fromDueDate'));
    this.filters.toDueDate = this.parseDateParam(params.get('toDueDate'));
    this.filters.fromCreatedAt = this.parseDateParam(params.get('fromCreatedAt'));
    this.filters.toCreatedAt = this.parseDateParam(params.get('toCreatedAt'));
    this.filters.fromAmount = this.parseNumberParam(params.get('fromAmount'));
    this.filters.toAmount = this.parseNumberParam(params.get('toAmount'));
  }

  private parseNumberParam(value: string | null, fallback?: number): number | undefined {
    if (value === null || value === '') {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseDateParam(value: string | null): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private buildQueryParams(): Record<string, string | number> {
    const queryParams: Record<string, string | number> = {
      page: this.currentPage,
      pageSize: this.pageSize,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    if (this.filters.title) queryParams['title'] = this.filters.title;
    if (this.filters.type) queryParams['type'] = this.filters.type;
    if (this.filters.paid) queryParams['paid'] = this.filters.paid;
    if (this.filters.category) queryParams['category'] = this.filters.category;
    if (this.filters.fromDueDate) queryParams['fromDueDate'] = this.filters.fromDueDate.toISOString();
    if (this.filters.toDueDate) queryParams['toDueDate'] = this.filters.toDueDate.toISOString();
    if (this.filters.fromCreatedAt) queryParams['fromCreatedAt'] = this.filters.fromCreatedAt.toISOString();
    if (this.filters.toCreatedAt) queryParams['toCreatedAt'] = this.filters.toCreatedAt.toISOString();
    if (this.filters.fromAmount !== undefined && this.filters.fromAmount !== null) queryParams['fromAmount'] = this.filters.fromAmount;
    if (this.filters.toAmount !== undefined && this.filters.toAmount !== null) queryParams['toAmount'] = this.filters.toAmount;

    return queryParams;
  }

  private updateQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(),
      replaceUrl: true
    });
  }

  onDateChange(value: string, key: keyof BillsFilter) {
    if (value) {
      // Set to UTC midnight
      const date = new Date(value + 'T00:00:00Z');
      this.filters[key] = date as any; // Cast to any to avoid type issues
    } else {
      this.filters[key] = undefined;
    }
    this.applyFilters();
  }

  applyFilters() {
    this.currentPage = 1;
    this.updateQueryParams();
  }

  sortByColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.updateQueryParams();
  }

  loadBills() {
    this.repo.getBills(
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
      this.filters.fromCreatedAt,
      this.filters.toCreatedAt,
      this.sortColumn,
      this.sortDirection
    )
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (result) => {
          this.bills = result.items;
          this.totalItems = result.totalCount;
          this.totalPages = result.totalPages || Math.ceil(this.totalItems / this.pageSize);
        },
        error: (err) => {
          this.toastr.error('Error loading bills.', 'Error');
        }
      });
  }

  loadCategories() {
    this.categoriesRepo.getCategories()
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (result) => {
          this.categories = result;
        },
        error: (err) => {
          this.toastr.error('Error loading categories.', 'Error');
        }
      });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updateQueryParams();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateQueryParams();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateQueryParams();
    }
  }

  goToAddBill() {
    this.router.navigate(['/bills/add'], {
      queryParams: {
        returnUrl: this.router.url
      }
    });
  }

  getBillDetailsUrl(billId: string) {
    return this.router.serializeUrl(this.router.createUrlTree(['/bills', billId], {
      queryParams: {
        returnUrl: this.router.url
      }
    }));
  }

  goToDetails(billId: string, event?: MouseEvent) {
    const detailsTree = this.router.createUrlTree(['/bills', billId], {
      queryParams: {
        returnUrl: this.router.url
      }
    });

    if (event?.ctrlKey || event?.button === 1) {
      const url = this.router.serializeUrl(detailsTree);
      window.open(url, '_blank');
    } else {
      this.router.navigateByUrl(detailsTree);
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updateQueryParams();
  }
}
