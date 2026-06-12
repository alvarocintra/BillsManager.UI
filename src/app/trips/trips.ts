import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faTrash, faEye, faMapLocationDot, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { ToastrService } from 'ngx-toastr';
import { TripsRepository } from '../services/trips.repository';
import { Trip } from '../models/trip.model';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './trips.html',
  styleUrl: './trips.scss'
})
export class Trips implements OnInit {
  trips: Trip[] = [];
  faPlus = faPlus;
  faTrash = faTrash;
  faEye = faEye;
  faMapLocationDot = faMapLocationDot;
  faCalendarDays = faCalendarDays;

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
        },
        error: () => this.toastr.error('Error loading trips.', 'Error')
      });
  }

  goToAddTrip() {
    this.router.navigate(['/trips/add']);
  }

  goToDetails(tripId: string) {
    this.router.navigate(['/trips/view', tripId]);
  }

  deleteTrip(tripId: string) {
    this.repo.deleteTrip(tripId)
      .pipe(finalize(() => this.loadTrips()))
      .subscribe({
        next: () => this.toastr.success('Trip deleted successfully!', 'Success'),
        error: () => this.toastr.error('Error deleting trip.', 'Error')
      });
  }

  tripDaysCount(trip: Trip) {
    return trip.days?.length || 0;
  }

  tripActivitiesCount(trip: Trip) {
    return (trip.days || []).reduce((acc, day) => acc + (day.activities?.length || 0), 0);
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
