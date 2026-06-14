import { Injectable } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { ConfirmDialogComponent } from '../shared/confirmation-modal.component/confirmation-modal.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  constructor(private dialog: Dialog) {}

  async confirm(title: string, message: string, confirmText = 'Yes', cancelText = 'No'): Promise<boolean | undefined> {
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: 
      { 
        title,
        message,
        confirmText,
        cancelText 
      },
      disableClose: true,
      width: '300px',
      panelClass: 'confirm-dialog-panel'
    });

    return await dialogRef.closed.toPromise().then(result => result === true);
  }
}
