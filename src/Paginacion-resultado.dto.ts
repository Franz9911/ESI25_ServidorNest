export class PaginacionResultado<T> {
    data: T[];
    totalItems: number;
    paginaActual?: number;
    itemsPorPagina?: number;
}