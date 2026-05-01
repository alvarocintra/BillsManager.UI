import { FilterParams } from "./filter.model";

export class BillsFilter extends FilterParams {
    title?: string;
    paid?: string; // null for 'any' state
    category?: string;
    fromDueDate?: Date;
    toDueDate?: Date;
    fromAmount?: number;
    toAmount?: number;

    constructor(
        title?: string,
        paid?: string,
        category?: string,
        fromDueDate?: Date,
        toDueDate?: Date,
        fromAmount?: number,
        toAmount?: number
    ) {
        super();
        this.title = title;
        this.paid = paid;
        this.category = category;
        this.fromDueDate = fromDueDate;
        this.toDueDate = toDueDate;
        this.fromAmount = fromAmount;
        this.toAmount = toAmount;
    }
}