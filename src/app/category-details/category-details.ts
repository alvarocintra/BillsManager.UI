import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CategoriesRepository } from '../services/categories.repository';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faScroll } from '@fortawesome/free-solid-svg-icons';
import { Category } from '../models/category.model';

@Component({
  standalone: true,
  selector: 'app-category-details',
  templateUrl: './category-details.html',
  styleUrl: './category-details.scss',
  imports: [ReactiveFormsModule, CommonModule, FontAwesomeModule]
})
export class CategoryDetails implements OnInit {
  category: Category | null = null;
  public form: FormGroup;
  faScroll = faScroll;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private repo: CategoriesRepository
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      keywords: ['']
    });
  }

  ngOnInit(): void {
    const categoryId = this.route.snapshot.paramMap.get('id') || 'add';
    if (categoryId !== 'add') {
      this.getCategoryDetails(categoryId);
    }
  }

  onSubmit() {
    if (this.form.invalid) {
      console.error('Form is invalid');
      return;
    }
    if (this.category && this.category.id) {
      this.updateCategory();
    } else {
      this.addCategory();
    }
  }

  addCategory() {
    const newCategory = this.toPayload() as Category;
    this.repo.addCategory(newCategory)
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (category) => {
          console.log('Category added successfully:', category);
          this.goBack();
        },
        error: (err) => {
          console.error('Error adding category:', err);
        }
      });
  }

  updateCategory() {
    const categoryId = this.category?.id;
    if (!categoryId) {
      console.error('Category id is required to update.');
      return;
    }

    const payload = this.toPayload();
    const updatedCategory = new Category(
      categoryId,
      payload.name,
      payload.keywords,
      this.category?.description,
      this.category?.icon,
      this.category?.color,
      this.category?.createdAt,
      this.category?.updatedAt
    );

    this.repo.updateCategory(updatedCategory)
      .pipe(finalize(() => {
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (category) => {
          console.log('Category updated successfully:', category);
          this.goBack();
        },
        error: (err) => {
          console.error('Error updating category:', err);
        }
      });
  }

  getCategoryDetails(categoryId: string) {
    this.repo.getCategoryById(categoryId)
    .pipe(finalize(() => {
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (category) => {
        this.category = category;
        this.form.patchValue({
          name: category.name,
          keywords: (category.keywords || []).join(', ')
        });
      },
      error: (err) => {
        console.error('Error fetching category details:', err);
      }
    });
  }

  goBack() {
    window.history.back();
  }

  private toPayload() {
    const formValue = this.form.value;
    const keywords = String(formValue.keywords || '')
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    return {
      name: formValue.name,
      keywords
    };
  }
}
