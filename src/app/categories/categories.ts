import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CategoriesRepository } from '../services/categories.repository';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash, faEye, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { Category } from '../models/category.model';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class Categories implements OnInit {
  categories: Category[] = [];
  faPlus = faPlus;
  faTrash = faTrash;
  faEye = faEye;
  faLayerGroup = faLayerGroup;

  constructor(
    private repo: CategoriesRepository,
    private confirmDialog: ConfirmDialogService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService) {
  }

  ngOnInit(): void {
    this.loadCategories();
    this.cdr.detectChanges();
  }

  loadCategories() {
    this.repo.getCategories()
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (err) => {
          this.toastr.error('Error loading categories.', 'Error');
        }
      });
  }

  // Navigate to the page to add a new category
  goToAddCategory() {
    this.router.navigate(['/categories/add']);
  }

  proceedDeleteCategory(categoryId: string) {
    this.repo.deleteCategory(categoryId)
      .pipe(finalize(() => {
        this.loadCategories();
      }))
      .subscribe({
        next: () => {
          this.toastr.success('Category deleted successfully!', 'Success');
          this.loadCategories();
        },
        error: (err) => {
          this.toastr.error('Error deleting category.', 'Error');
        }
      });
  }

  async deleteCategory(id: string) {
    const confirmed = await this.confirmDialog.confirm('Confirm Deletion', 'Are you sure you want to delete this category?');
    if (confirmed) {
      this.proceedDeleteCategory(id);
    }
  }

  goToDetails(categoryId: string) {
    this.router.navigate(['/categories', categoryId]);
  }
}
