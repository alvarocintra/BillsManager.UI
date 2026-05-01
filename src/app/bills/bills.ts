import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { BillsRepository } from '../services/bills.repository';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash, faEye, faMoneyBills, faChevronRight, faChevronLeft, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Bill } from '../models/bill.model';
import { FormsModule } from '@angular/forms';
import { Category } from '../models/category.model';
import { CategoriesRepository } from '../services/categories.repository';
import { BillsFilter } from '../models/bills-filter.model';

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
    paid: '',
    category: '',
    fromDueDate: undefined,
    toDueDate: undefined,
    fromCreatedAt: undefined,
    toCreatedAt: undefined,
    fromAmount: undefined,
    toAmount: undefined
  };

  sortColumn: string = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private repo: BillsRepository,
    private categoriesRepo: CategoriesRepository,
    private router: Router,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.loadBills();
    this.loadCategories();
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
    this.loadBills();
  }

  sortByColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadBills();
  }

  loadBills() {
    this.repo.getBills(
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
          console.error('Error loading bills:', err);
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
          console.error('Error loading categories:', err);
        }
      });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadBills();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadBills();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadBills();
    }
  }

  goToAddBill() {
    this.router.navigate(['/bills/add']);
  }

  goToDetails(categoryId: string) {
    this.router.navigate(['/bills', categoryId]);
  }
}
