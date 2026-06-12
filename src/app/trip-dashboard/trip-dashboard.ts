import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendarDays, faChartColumn, faCircleNodes, faMapLocationDot, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { TripsRepository } from '../services/trips.repository';
import { Trip } from '../models/trip.model';

@Component({
  selector: 'app-trip-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './trip-dashboard.html',
  styleUrl: './trip-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripDashboard implements OnInit {
  trips: Trip[] = [];
  featuredTrip: Trip | null = null;
  totalTrips = 0;
  totalDays = 0;
  totalActivities = 0;
  upcomingTrips = 0;

  faCalendarDays = faCalendarDays;
  faChartColumn = faChartColumn;
  faCircleNodes = faCircleNodes;
  faMapLocationDot = faMapLocationDot;
  faPlus = faPlus;

  constructor(
    private repo: TripsRepository,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips() {
    this.repo.getTrips()
      .pipe(finalize(() => this.cdr.detectChanges()))
      .subscribe({
        next: trips => {
          this.trips = trips;
          this.featuredTrip = this.pickFeaturedTrip(trips);
          this.setupStats(trips);
        },
        error: () => this.toastr.error('Error loading trips dashboard.', 'Error')
      });
  }

  goToTripManager() {
    this.router.navigate(['/trips']);
  }

  goToAddTrip() {
    this.router.navigate(['/trips/add']);
  }

  goToViewTrip(tripId: string) {
    this.router.navigate(['/trips/view', tripId]);
  }

  getTripCover(trip: Trip): string {
    return trip.coverImageUrl || this.getCoverFallback(trip);
  }

  getTripSubtitle(trip: Trip): string {
    const parts = [trip.destination, this.getDateRange(trip)];
    return parts.filter(Boolean).join(' • ');
  }

  getTripDays(trip: Trip): number {
    return trip.startDate && trip.endDate
      ? Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
      : trip.days.length;
  }

  getTripPlannedDays(trip: Trip): number {
    return trip.days.length;
  }

  getTripActivities(trip: Trip): number {
    return (trip.days || []).reduce((sum, day) => sum + (day.activities?.length || 0), 0);
  }

  private setupStats(trips: Trip[]) {
    this.totalTrips = trips.length;
    // this.totalDays = trips.reduce((sum, trip) => sum + this.getTripDays(trip), 0);
    // the total days should be the sum of the number of days of each trip, from start to end dates
    this.totalDays = trips.reduce((sum, trip) => {
      if (trip.startDate && trip.endDate) {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }
      return sum;
    }, 0);
    this.totalActivities = trips.reduce((sum, trip) => sum + this.getTripActivities(trip), 0);
    this.upcomingTrips = trips.filter(trip => {
      if (!trip.startDate) return false;
      return new Date(trip.startDate) >= new Date(new Date().toDateString());
    }).length;
  }

  private pickFeaturedTrip(trips: Trip[]): Trip | null {
    if (!trips.length) {
      return null;
    }

    return [...trips].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    })[0] || null;
  }

  private getDateRange(trip: Trip): string {
    if (!trip.startDate && !trip.endDate) {
      return '';
    }

    const start = trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '';
    const end = trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '';
    return start && end ? `${start} - ${end}` : start || end;
  }

  private getCoverFallback(trip: Trip): string {
    const colors = [
      'linear-gradient(135deg, #2c3e50, #415d78)',
      'linear-gradient(135deg, #c2410c, #f97316)',
      'linear-gradient(135deg, #0f766e, #14b8a6)',
      'linear-gradient(135deg, #7c3aed, #a855f7)'
    ];

    let hash = 0;
    for (let i = 0; i < trip.name.length; i++) {
      hash = trip.name.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${colors[index].includes('#2c3e50') ? '#2c3e50' : '#1f2937'}"/>
            <stop offset="100%" stop-color="${colors[index].includes('#2c3e50') ? '#415d78' : '#111827'}"/>
          </linearGradient>
        </defs>
        <rect width="800" height="500" fill="url(#g)"/>
        <circle cx="640" cy="110" r="90" fill="rgba(255,255,255,0.12)"/>
        <circle cx="160" cy="370" r="130" fill="rgba(255,255,255,0.08)"/>
        <text x="60" y="285" font-size="60" fill="white" font-family="Arial, sans-serif" font-weight="700">${this.escapeXml(trip.name)}</text>
        <text x="60" y="345" font-size="28" fill="rgba(255,255,255,0.82)" font-family="Arial, sans-serif">${this.escapeXml(trip.destination || 'Trip Manager')}</text>
      </svg>
    `)}`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
