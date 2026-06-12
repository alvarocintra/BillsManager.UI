import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapLocationDot, faTrash, faPlus, faCloudArrowUp, faLink, faDownload } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { TripsRepository } from '../services/trips.repository';
import { Trip, TripAttachment, TripDay } from '../models/trip.model';

@Component({
  selector: 'app-trip-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './trip-details.html',
  styleUrl: './trip-details.scss'
})
export class TripDetails implements OnInit {
  trip: Trip | null = null;
  isEditMode = false;

  faMapLocationDot = faMapLocationDot;
  faTrash = faTrash;
  faPlus = faPlus;
  faCloudArrowUp = faCloudArrowUp;
  faLink = faLink;
  faDownload = faDownload;

  fileInputs: Record<string, File | null> = {};

  form!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private repo: TripsRepository,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      destination: [''],
      description: [''],
      coverImageUrl: [''],
      startDate: [''],
      endDate: [''],
      attachments: this.fb.array([]),
      days: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const tripId = params.get('id') || 'add';
      this.isEditMode = tripId !== 'add';

      if (this.isEditMode) {
        this.loadTrip(tripId);
      } else {
        this.initializeNewTrip();
      }
    });
  }

  get attachmentsArray(): FormArray {
    return this.form.get('attachments') as FormArray;
  }

  get daysArray(): FormArray {
    return this.form.get('days') as FormArray;
  }

  getDayActivities(dayIndex: number): FormArray {
    return this.daysArray.at(dayIndex).get('activities') as FormArray;
  }

  getDayAttachments(dayIndex: number): FormArray {
    return this.daysArray.at(dayIndex).get('attachments') as FormArray;
  }

  addAttachmentForm(attachment?: Partial<TripAttachment>) {
    this.attachmentsArray.push(this.createAttachmentGroup(attachment));
  }

  addDay(day?: Partial<TripDay>) {
    this.daysArray.push(this.createDayGroup(day));
  }

  addActivity(dayIndex: number) {
    this.getDayActivities(dayIndex).push(this.createActivityGroup());
  }

  removeAttachment(index: number) {
    this.attachmentsArray.removeAt(index);
  }

  removeDay(index: number) {
    this.daysArray.removeAt(index);
  }

  removeActivity(dayIndex: number, activityIndex: number) {
    this.getDayActivities(dayIndex).removeAt(activityIndex);
  }

  onFileSelected(dayIndex: number | 'trip', attachmentIndex: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const key = dayIndex === 'trip' ? `trip-${attachmentIndex}` : `day-${dayIndex}-${attachmentIndex}`;
    this.fileInputs[key] = file;
  }

  onCoverImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toastr.error('Please choose an image file.', 'Error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.form.patchValue({ coverImageUrl: dataUrl });
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.toastr.error('Form is invalid.', 'Error');
      return;
    }

    const wasEditMode = this.isEditMode;
    const payload = this.toTripPayload();
    console.log(this.toTripPayload);
    const request$ = this.trip?.id ? this.repo.updateTrip(payload) : this.repo.addTrip(payload);

    request$
      .pipe(finalize(() => this.cdr.detectChanges()))
      .subscribe({
        next: async savedTrip => {
          this.trip = savedTrip;
          this.isEditMode = true;
          this.form.patchValue({
            startDate: savedTrip.startDate,
            endDate: savedTrip.endDate
          });
          this.toastr.success('Trip saved successfully!', 'Success');
          if (!wasEditMode) {
            await this.router.navigate(['/trips/view', savedTrip.id]);
          } else {
            this.loadTrip(savedTrip.id);
          }
        },
        error: () => this.toastr.error('Error saving trip.', 'Error')
      });
  }

  loadTrip(tripId: string) {
    this.repo.getTripById(tripId)
      .pipe(finalize(() => this.cdr.detectChanges()))
      .subscribe({
        next: trip => {
          this.trip = trip;
          this.fileInputs = {};
          this.form.patchValue({
            name: trip.name,
            destination: trip.destination || '',
            description: trip.description || '',
            coverImageUrl: trip.coverImageUrl || '',
            startDate: trip.startDate,
            endDate: trip.endDate
          });

          this.attachmentsArray.clear();
          this.daysArray.clear();

          this.addAttachmentForm();
          (trip.days || []).forEach(day => this.addDay(day));

          if ((trip.days || []).length === 0) {
            this.addDay();
          }
        },
        error: () => this.toastr.error('Error fetching trip details.', 'Error')
      });
  }

  async deleteTrip() {
    if (!this.trip?.id) {
      return;
    }

    const tripId = this.trip.id;

    if (!confirm('Delete this trip?')) {
      return;
    }

    this.repo.deleteTrip(tripId)
      .pipe(finalize(() => this.cdr.detectChanges()))
      .subscribe({
        next: () => {
          this.toastr.success('Trip deleted successfully!', 'Success');
          this.router.navigate(['/trips']);
        },
        error: () => this.toastr.error('Error deleting trip.', 'Error')
      });
  }

  addGlobalAttachment() {
    this.addAttachmentForm();
  }

  addDayAttachment(dayIndex: number) {
    this.getDayAttachments(dayIndex).push(this.createAttachmentGroup());
  }

  saveAttachment(dayIndex: number | 'trip', attachmentIndex: number) {
    const group = dayIndex === 'trip'
      ? this.attachmentsArray.at(attachmentIndex)
      : this.getDayAttachments(dayIndex).at(attachmentIndex);

    const raw = group.getRawValue();
    const key = dayIndex === 'trip' ? `trip-${attachmentIndex}` : `day-${dayIndex}-${attachmentIndex}`;
    const selectedFile = this.fileInputs[key];
    const tripId = this.trip?.id;

    if (!tripId) {
      this.toastr.error('Save the trip first before attaching files or links.', 'Error');
      return;
    }

    if (!selectedFile && !raw.url) {
      this.toastr.error('Provide a link or select a file before saving the attachment.', 'Error');
      return;
    }

    if (selectedFile) {
      this.repo.uploadAttachment(tripId, {
        dayId: dayIndex === 'trip' ? null : this.daysArray.at(dayIndex as number).get('id')?.value,
        title: raw.title,
        description: raw.description,
        isPhoto: raw.isPhoto,
        file: selectedFile
      }).subscribe({
        next: () => {
          this.toastr.success('Attachment uploaded.', 'Success');
          this.fileInputs[key] = null;
          this.loadTrip(tripId);
        },
        error: () => this.toastr.error('Error uploading attachment.', 'Error')
      });
      return;
    }

    if (raw.url) {
      this.repo.addLinkAttachment(tripId, {
        dayId: dayIndex === 'trip' ? null : this.daysArray.at(dayIndex as number).get('id')?.value,
        title: raw.title,
        description: raw.description,
        url: raw.url,
        isPhoto: raw.isPhoto
      }).subscribe({
        next: () => {
          this.toastr.success('Link saved.', 'Success');
          this.fileInputs[key] = null;
          this.loadTrip(tripId);
        },
        error: () => this.toastr.error('Error saving link.', 'Error')
      });
    }
  }

  removeAttachmentItem(dayIndex: number | 'trip', attachmentId: string) {
    if (!this.trip?.id || !attachmentId) {
      return;
    }

    const tripId = this.trip.id;

    this.repo.deleteAttachment(tripId, attachmentId).subscribe({
      next: () => {
        this.toastr.success('Attachment deleted.', 'Success');
        this.loadTrip(tripId);
      },
      error: () => this.toastr.error('Error deleting attachment.', 'Error')
    });
  }

  downloadAttachment(attachment: TripAttachment) {
    if (!this.trip?.id || !attachment.id) {
      return;
    }

    this.repo.downloadAttachment(this.trip.id, attachment.id).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = attachment.fileName || attachment.title || 'attachment';
        anchor.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.toastr.error('Error downloading attachment.', 'Error')
    });
  }

  openLink(attachment: TripAttachment) {
    if (attachment.url) {
      window.open(attachment.url, '_blank', 'noopener');
    }
  }

  goBack() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    this.router.navigate(['/trips']);
  }

  private createAttachmentGroup(attachment?: Partial<TripAttachment>) {
    return this.fb.group({
      id: [attachment?.id || ''],
      title: [attachment?.title || ''],
      description: [attachment?.description || ''],
      url: [attachment?.url || ''],
      isPhoto: [attachment?.isPhoto || false],
      kind: [attachment?.kind || 'link']
    });
  }

  private createActivityGroup(activity?: Partial<{ id: string; order: number; title: string; time?: string | null; notes?: string | null, price?: number | null }>) {
    return this.fb.group({
      id: [activity?.id || ''],
      order: [activity?.order || 1],
      title: [activity?.title || '', Validators.required],
      time: [activity?.time || ''],
      notes: [activity?.notes || ''],
      price: [activity?.price || '']
    });
  }

  private createDayGroup(day?: Partial<TripDay>) {
    const group = this.fb.group({
      id: [day?.id || ''],
      dayNumber: [day?.dayNumber || this.daysArray.length + 1, Validators.required],
      title: [day?.title || '', Validators.required],
      date: [day?.date, Validators.required],
      notes: [day?.notes || ''],
      activities: this.fb.array([]),
      attachments: this.fb.array([])
    });

    const activities = (day?.activities || []);
    if (activities.length > 0) {
      activities.forEach(activity => this.getActivitiesArray(group).push(this.createActivityGroup(activity)));
    }

    return group;
  }

  private initializeNewTrip() {
    this.trip = null;
    this.fileInputs = {};
    this.form.reset({
      name: '',
      destination: '',
      description: '',
      coverImageUrl: '',
      startDate: '',
      endDate: ''
    });
    this.attachmentsArray.clear();
    this.daysArray.clear();
    this.addDay();
  }

  private getActivitiesArray(dayGroup: AbstractControl): FormArray {
    return dayGroup.get('activities') as FormArray;
  }

  private getAttachmentsArray(dayGroup: AbstractControl): FormArray {
    return dayGroup.get('attachments') as FormArray;
  }

  private toTripPayload(): Trip {
    const raw = this.form.getRawValue();

    return {
      id: this.trip?.id || '',
      name: raw.name || '',
      destination: raw.destination || null,
      description: raw.description || null,
      coverImageUrl: raw.coverImageUrl || null,
      startDate: raw.startDate || null,
      endDate: raw.endDate || null,
      createdAt: this.trip?.createdAt || null,
      updatedAt: this.trip?.updatedAt || null,
      attachments: this.trip?.attachments || [],
      days: (raw.days || []).map((day: any, index: number) => ({
        id: day.id || '',
        dayNumber: Number(day.dayNumber) || index + 1,
        title: day.title || '',
        date: day.date || null,
        notes: day.notes || null,
        attachments: this.trip?.days.find(existingDay => existingDay.id === day.id)?.attachments || [],
        activities: (day.activities || []).map((activity: any, activityIndex: number) => ({
          id: activity.id || '',
          order: Number(activity.order) || activityIndex + 1,
          title: activity.title || '',
          time: activity.time || null,
          notes: activity.notes || null,
          price: Number(activity.price) || null
        }))
      }))
    };
  }
}
