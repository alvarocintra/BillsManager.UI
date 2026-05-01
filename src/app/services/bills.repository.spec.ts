import { TestBed } from '@angular/core/testing';

import { BillsRepository } from './bills.repository';

describe('BillsRepository', () => {
  let service: BillsRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillsRepository);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
