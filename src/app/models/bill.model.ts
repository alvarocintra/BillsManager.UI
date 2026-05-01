import { Category } from "./category.model";

export class Bill {
    id: string;
    title: string;
    amount: number;
    dueDate: Date;
    categoryId: string;
    paid: boolean;
    isRecurring: boolean;
    recurrence: string;
    recurrenceEndDate: Date | null;
    category?: Category;
    createdAt?: Date;
    updatedAt?: Date;
    
    constructor(
        id: string,
        title: string,
        amount: number,
        dueDate: Date,
        categoryId: string,
        paid: boolean = false,
        isRecurring: boolean = false,
        recurrence: string = '',
        recurrenceEndDate: Date | null = null,
        category?: Category,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        this.id = id;
        this.title = title;
        this.amount = amount;
        this.dueDate = dueDate;
        this.categoryId = categoryId;
        this.paid = paid;
        this.isRecurring = isRecurring;
        this.recurrence = recurrence;
        this.recurrenceEndDate = recurrenceEndDate;
        this.category = category;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}