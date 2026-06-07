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
    this.router.navigate(['/trips', tripId]);
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
}
