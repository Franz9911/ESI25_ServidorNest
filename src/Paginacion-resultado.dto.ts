export class PaginacionResultado<T> {
    data: T[];
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
}