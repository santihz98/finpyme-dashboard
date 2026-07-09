export interface IngresoCategoria {
  nombre: string
  valor: number
}

export interface Anomalia {
  tipo: string
  magnitud_pct: number
  descripcion: string
}

export interface MesData {
  periodo: string // "2025-01"
  ingresos: {
    categorias: IngresoCategoria[]
    total: number
  }
  gastos: {
    nomina: number
    proveedores: number
    arriendo: number
    servicios: number
    otros: number
    total: number
    // La clínica usa claves propias — se accede via index cuando sea necesario
    [key: string]: number
  }
  utilidad_neta: number
  margen_pct: number
  _anomalia?: Anomalia
}

export interface EmpresaData {
  empresa: {
    nombre: string
    nit: string
    ciudad: string
    sector: string
  }
  año_base: number
  generado_en: string
  anomalias_año: Anomalia[]
  meses: MesData[]
}

export interface AnalisisIA {
  resumen: string
  alertas: { tipo: 'warning' | 'danger' | 'success'; mensaje: string }[]
  recomendacion_principal: string
}
