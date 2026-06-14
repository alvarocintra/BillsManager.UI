import { ChangeDetectorRef, Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { BillsRepository } from '../services/bills.repository';
import { CategoriesRepository } from '../services/categories.repository';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMoneyBill, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Bill } from '../models/bill.model';
import { ConfirmDialogComponent } from '../shared/confirmation-modal.component/confirmation-modal.component';
import { ConfirmDialogService } from '../services/confirm-dialog.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-bill-details',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FontAwesomeModule,
  ],
  templateUrl: './bill-details.html',
  styleUrl: './bill-details.scss',
  standalone: true,
})
export class BillDetails {
  bill!: Bill;
  public form: FormGroup;
  public categories: any[] = [];
  faMoneyBill = faMoneyBill;
  faTrash = faTrash;
  isEditMode: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private repo: BillsRepository,
    private categoriesRepo: CategoriesRepository,
    private confirmDialog: ConfirmDialogService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      type: ['expense', Validators.required],
      title: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      dueDate: [''],
      categoryId: ['', Validators.required],
      paid: [false],
      isRecurring: [false],
      recurrence: [null],
      recurrenceEndDate: [null],
      notes: [''],
    });
  }

  ngOnInit(): void {
    const billId = this.route.snapshot.paramMap.get('id') || 'add';
    this.isEditMode = billId !== 'add';
    if (billId !== 'add') {
      this.getBillDetails(billId);
    }
  }

  ngAfterViewInit() {
    this.loadCategories();
  }

  updateValidators() {
    this.form.get('recurrence')?.setValidators(this.form.get('isRecurring')?.value ? [Validators.required] : null);
    this.form.get('recurrenceEndDate')?.setValidators(this.form.get('isRecurring')?.value ? [Validators.required] : null);
    this.form.get('recurrence')?.updateValueAndValidity();
    this.form.get('recurrenceEndDate')?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  loadCategories() {
    this.categoriesRepo.getCategories()
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          if (this.bill && this.bill.categoryId) {
            this.form.patchValue({ categoryId: this.bill.categoryId });
          }
        },
        error: (err) => {
          this.toastr.error('Error loading categories.', 'Error');
        }
      });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.toastr.error('Form is invalid.', 'Error');
      return;
    }
    if (this.bill && this.bill.id) {
      this.updateBill();
    } else {
      this.addBill();
    }
  }

  addBill() {
    const newBill = this.form.value;
    this.repo.addBill(newBill)
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (bill) => {
          this.toastr.success('Bill added successfully!', 'Success');
          this.goBack();
        },
        error: (err) => {
          this.toastr.error('Error adding bill.', 'Error');
        }
      });
  }

  updateBill() {
    const updatedBill = {
      ...this.bill,
      ...this.form.value
    };
    this.repo.updateBill(updatedBill)
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (bill) => {
          this.toastr.success('Bill updated successfully!', 'Success');
          this.goBack();
        },
        error: (err) => {
          this.toastr.error('Error updating bill.', 'Error');
        }
      });
  }

  getBillDetails(billId: string) {
    this.repo.getBillById(billId)
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (bill) => {
          this.bill = bill;
        this.form.patchValue({
          type: bill.type || 'expense',
          title: bill.title,
            amount: bill.amount,
            dueDate: new Date(bill.dueDate).toISOString().substring(0, 10), // Format to YYYY-MM-DD
            categoryId: bill.categoryId,
            paid: bill.paid || false,
            isRecurring: bill.isRecurring || false,
            recurrence: bill.recurrence || '',
            recurrenceEndDate: bill.recurrenceEndDate ? new Date(bill.recurrenceEndDate).toISOString().substring(0, 10) : null,

          });
        },
        error: (err) => {
          this.toastr.error('Error fetching bill details.', 'Error');
        }
      });
  }

  async deleteBill(id: string) {
    const confirmed = await this.confirmDialog.confirm(
      'Confirm Deletion',
      'Are you sure you want to delete this bill?');
    if (confirmed) {
      this.proceedDeleteBill(id);
    }
  }

  proceedDeleteBill(billId: string) {
    this.repo.deleteBill(billId)
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Bill deleted successfully!', 'Success');
          this.goBack();
        },
        error: (err) => {
          this.toastr.error('Error deleting bill.', 'Error');
        }
      });
  }

  goBack() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    this.router.navigate(['/bills']);
  }
}
