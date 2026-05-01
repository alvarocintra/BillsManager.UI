import { Component, inject, ViewEncapsulation } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None // Add this line
})
export class ConfirmDialogComponent {
  dialogRef = inject(DialogRef<boolean>);
  data = inject(DIALOG_DATA) as {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  };
}
