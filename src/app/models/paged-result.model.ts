export class PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages?: number;

    constructor(items: T[], totalCount: number, pageNumber: number, pageSize: number, totalPages?: number) {
        this.items = items;
        this.totalCount = totalCount;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.totalPages = totalPages || Math.ceil(totalCount / pageSize);
    }
}