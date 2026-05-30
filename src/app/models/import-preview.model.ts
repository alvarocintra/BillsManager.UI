export interface ImportPreviewItem {
  lineNumber: number;
  rawLine: string;
  dueDate: string | null;
  title: string;
  amount: number | null;
  type: 'expense' | 'income';
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
  isParsedAsTransaction: boolean;
  isPossibleDuplicate: boolean;
}

export interface ImportPreviewResult {
  fileName: string;
  totalLines: number;
  parsedTransactions: number;
  items: ImportPreviewItem[];
}

export interface ImportCommitItem {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  dueDate: string;
  categoryId: string;
  paid: boolean;
}

export interface ImportCommitRequest {
  items: ImportCommitItem[];
}

export interface ImportCommitResult {
  savedCount: number;
  ignoredCount: number;
}
