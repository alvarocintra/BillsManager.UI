import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface DateRange {
  from: string;
  to: string;
}

@Component({
  selector: 'app-date-range-filter',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="date-range-filter">
      <label>
        <span>De</span>
        <input type="date" [ngModel]="fromDate" (ngModelChange)="onDateChange('from', $event)" aria-label="Data inicial" />
      </label>
      <label>
        <span>Até</span>
        <input type="date" [ngModel]="toDate" (ngModelChange)="onDateChange('to', $event)" aria-label="Data final" />
      </label>
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 0; }
    .date-range-filter {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.8rem;
    }
    label { display: flex; align-items: center; gap: 0.35rem; }
    input {
      width: 145px;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 0.4rem 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #fff;
      color: #334155;
    }
    @media (max-width: 600px) {
      .date-range-filter { width: 100%; }
      label { flex: 1 1 135px; min-width: 0; }
      input { flex: 1; width: 100%; }
    }
  `]
})
export class DateRangeFilterComponent {
  @Input() fromDate = '';
  @Input() toDate = '';
  @Output() dateRangeChange = new EventEmitter<DateRange>();

  onDateChange(field: 'from' | 'to', value: string): void {
    if (field === 'from') this.fromDate = value;
    else this.toDate = value;

    this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
  }
}
