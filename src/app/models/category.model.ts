export class Category {
    id: string;
    name: string;
    keywords: string[];
    description?: string;
    icon?: string;
    color?: string;
    createdAt?: Date;
    updatedAt?: Date;

    constructor(id: string, name: string, keywords: string[] = [], description?: string, icon?: string, color?: string, createdAt?: Date, updatedAt?: Date) {
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.id = id;
        this.name = name;
        this.keywords = keywords;
        this.description = description;
        this.icon = icon;
        this.color = color;
    }
}
