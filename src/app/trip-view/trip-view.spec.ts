import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { TripView } from './trip-view';
import { TripsRepository } from '../services/trips.repository';

const sampleTrip = {
  id: 'trip-1',
  name: 'Sample trip',
  destination: 'Tokyo',
  days: [],
  attachments: []
};

describe('TripView', () => {
  let component: TripView;
  let fixture: ComponentFixture<TripView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripView],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'trip-1' })),
            snapshot: { queryParamMap: convertToParamMap({}) }
          }
        },
        {
          provide: TripsRepository,
          useValue: {
            getTripById: () => of(sampleTrip),
            downloadAttachment: () => of(new Blob())
          }
        },
        {
          provide: ToastrService,
          useValue: {
            error: () => undefined,
            success: () => undefined
          }
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
            navigateByUrl: () => Promise.resolve(true),
            url: '/trips/view/trip-1'
          }
        },
        {
          provide: ChangeDetectorRef,
          useValue: {
            detectChanges: () => undefined
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
