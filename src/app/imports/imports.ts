import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Category } from '../models/category.model';
import { ImportCommitRequest, ImportPreviewItem, ImportPreviewResult } from '../models/import-preview.model';
import { CategoriesRepository } from '../services/categories.repository';
import { ImportsRepository } from '../services/imports.repository';

@Component({
  selector: 'app-imports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imports.html',
  styleUrl: './imports.scss'
})
export class Imports {
  file: File | null = null;
  loadingPreview = false;
  committing = false;
  preview: ImportPreviewResult | null = null;
  categories: Category[] = [];
  selected: Record<number, boolean> = {};
  message = '';

  constructor(
    private importsRepo: ImportsRepository,
    private categoriesRepo: CategoriesRepository,
    private cdr: ChangeDetectorRef
  ) {
    this.loadCategories();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
    this.preview = null;
    this.message = '';
  }

  loadPreview(): void {
    if (!this.file) {
      this.message = 'Selecione um PDF primeiro.';
      return;
    }

    this.loadingPreview = true;
    this.message = '';
    this.importsRepo.preview(this.file)
      .pipe(finalize(() => {
        this.loadingPreview = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (result) => {
          this.preview = result;
          this.selected = {};
          result.items.forEach((item, idx) => {
            this.selected[idx] = item.isParsedAsTransaction && !item.isPossibleDuplicate;
          });
        },
        error: () => {
          this.message = 'Erro ao gerar preview.';
        }
      });
  }

  commit(): void {
    if (!this.preview) {
      this.message = 'Gere um preview antes de confirmar.';
      return;
    }

    const items = this.preview.items
      .filter((item, idx) => this.selected[idx])
      .filter(item => this.isValidCommitItem(item))
      .map(item => ({
        title: item.title.trim(),
        amount: item.amount as number,
        type: item.type || 'expense',
        dueDate: item.dueDate as string,
        categoryId: item.suggestedCategoryId as string,
        paid: false
      }));

    const request: ImportCommitRequest = { items };
    this.committing = true;
    this.importsRepo.commit(request)
      .pipe(finalize(() => {
        this.committing = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (result) => {
          this.message = `Importacao concluida. Salvos: ${result.savedCount}, ignorados: ${result.ignoredCount}.`;
        },
        error: () => {
          this.message = 'Erro ao confirmar importacao.';
        }
      });
  }

  private loadCategories(): void {
    this.categoriesRepo.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      }
    });
  }

  private isValidCommitItem(item: ImportPreviewItem): boolean {
    return !!item.title && item.amount !== null && !!item.dueDate && !!item.suggestedCategoryId;
  }
  hasPossibleDuplicates(): boolean | null {
    return this.preview && this.preview.items.some(i => i && i.isPossibleDuplicate);
  }
}
