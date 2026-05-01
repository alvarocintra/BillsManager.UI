import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CategoriesRepository } from '../services/categories.repository';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash, faEye, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { Category } from '../models/category.model';

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
    private router: Router,
    private cdr: ChangeDetectorRef) {
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
          console.error('Error loading categories:', err);
        }
      });
  }

  // Navigate to the page to add a new category
  goToAddCategory() {
    this.router.navigate(['/categories/add']);
  }

  deleteCategory(categoryId: string) {
    this.repo.deleteCategory(categoryId)
      .pipe(finalize(() => {
        this.loadCategories();
      }))
      .subscribe({
        next: () => {
          console.log('Category deleted successfully');
        },
        error: (err) => {
          console.error('Error deleting category:', err);
        }
      });
  }

  goToDetails(categoryId: string) {
    this.router.navigate(['/categories', categoryId]);
  }
}
