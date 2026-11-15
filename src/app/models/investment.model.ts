export interface Investment {
  id: string;
  type: 'stock' | 'other' | string;
  name: string;
  category: string;
  resource: string;
  currency: string;
  currentValue: number;
  unitPrice?: number | null;
  lastUpdatedAt: string | Date;
  ticker?: string | null;
  quantity?: number | null;
}

export interface InvestmentsQuery {
  Name?: string;
  Type?: string;
  Category?: string;
  Resource?: string;
  Currency?: string;
  Ticker?: string;
  FromValue?: number | null;
  ToValue?: number | null;
  FromLastUpdatedAt?: string | null;
  ToLastUpdatedAt?: string | null;
  PageNumber: number;
  PageSize: number;
  SortBy: string;
  SortOrder: 'asc' | 'desc';
}

export interface PagedInvestments {
  items: Investment[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface InvestmentUpsertRequest {
  type: 'stock' | 'other';
  name: string;
  category: string;
  resource: string;
  currency: string;
  ticker?: string | null;
  quantity?: number | null;
  initialValue?: number | null;
  valuationDate?: string | null;
}

export interface InvestmentSnapshotRequest {
  value: number;
  currency: string;
  valuationDate?: string | null;
}

export interface InvestmentSnapshot {
  id: string;
  investmentId: string;
  value: number;
  currency: string;
  recordedAt: string | Date;
}

export interface InvestmentBreakdown {
  key: string;
  value: number;
}

export interface InvestmentCurrencySummary {
  currency: string;
  totalValue: number;
  byType: InvestmentBreakdown[];
  byCategory: InvestmentBreakdown[];
  byResource: InvestmentBreakdown[];
}

export interface InvestmentSummary {
  currencies: InvestmentCurrencySummary[];
}
