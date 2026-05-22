export enum TipoMovInventario{
    RECEPCION_COMPRA = "compra",
    AJUSTE_NEGATIVO = "ajuste negativo",
    AJUSTE_POSITIVO = "ajuste positivo",
    DEVOLUCION_PROVEEDOR = "devolucion proveedor",
    DEVOLUCION_CLIENTE = "devolucion cliente",
    SALIDA_VENTA = "venta",
    CONSUMO_INTERNO = "consumo interno"
}
export enum SentidoMovInventario{
    INGRESO="ingreso", 
    SALIDA="salida",
}