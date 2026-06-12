import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCalendarDays, faDownload, faLink, faMapLocationDot, faPenToSquare, faPaperclip, faSpinner, faChartColumn } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TripsRepository } from '../services/trips.repository';
import { Trip, TripAttachment, TripDay } from '../models/trip.model';

@Component({
  selector: 'app-trip-view',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './trip-view.html',
  styleUrl: './trip-view.scss',
})
export class TripView implements OnInit {
  trip: Trip | null = null;
  isLoading = false;

  faArrowLeft = faArrowLeft;
  faCalendarDays = faCalendarDays;
  faDownload = faDownload;
  faLink = faLink;
  faMapLocationDot = faMapLocationDot;
  faPenToSquare = faPenToSquare;
  faPaperclip = faPaperclip;
  faSpinner = faSpinner;
  faChartColumn = faChartColumn;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repo: TripsRepository,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const tripId = params.get('id');
        if (!tripId) {
          this.trip = null;
          return;
        }

        this.loadTrip(tripId);
      });
  }

  loadTrip(tripId: string) {
    this.isLoading = true;
    this.repo.getTripById(tripId)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: trip => {
          this.trip = trip;
        },
        error: () => {
          this.trip = null;
          this.toastr.error('Error fetching trip details.', 'Error');
        }
      });
  }

  goBack() {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    this.router.navigate(['/trips']);
  }

  goToEdit() {
    if (!this.trip?.id) {
      return;
    }

    this.router.navigate(['/trips', this.trip.id], {
      queryParams: {
        returnUrl: this.router.url
      }
    });
  }

  tripDaysCount(trip: Trip): number {
    return trip.days?.length || 0;
  }

  tripActivitiesCount(trip: Trip): number {
    return (trip.days || []).reduce((count, day) => count + (day.activities?.length || 0), 0);
  }

  tripAttachmentsCount(trip: Trip): number {
    return (trip.attachments || []).length + (trip.days || []).reduce((count, day) => count + (day.attachments?.length || 0), 0);
  }

  dayActivitiesCount(day: TripDay): number {
    return day.activities?.length || 0;
  }

  openLink(attachment: TripAttachment) {
    if (attachment.url) {
      window.open(attachment.url, '_blank', 'noopener');
    }
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

  getTripCover(trip: Trip): string {
    return trip.coverImageUrl || this.getFallbackCover(trip.name);
  }

  private getFallbackCover(name: string): string {
    const palette = [
      'linear-gradient(135deg, #2c3e50, #415d78)',
      'linear-gradient(135deg, #c2410c, #f97316)',
      'linear-gradient(135deg, #0f766e, #14b8a6)',
      'linear-gradient(135deg, #7c3aed, #a855f7)'
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const background = palette[Math.abs(hash) % palette.length];
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">
        <rect width="400" height="220" fill="#1f2937"/>
        <rect width="400" height="220" fill="url(#g)" opacity="0.96"/>
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${background.includes('#2c3e50') ? '#2c3e50' : '#111827'}"/>
            <stop offset="100%" stop-color="${background.includes('#2c3e50') ? '#415d78' : '#0f172a'}"/>
          </linearGradient>
        </defs>
        <text x="24" y="126" font-size="34" fill="white" font-family="Arial, sans-serif" font-weight="700">${name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>
      </svg>
    `)}`;
  }
}
