
import { IndicatorDef } from './types';

// Based on the provided HTML logic and Res 1820 structure
export const INDICATORS: IndicatorDef[] = [
  {
    id: 'rubro',
    title: 'Clasificación del riesgo por rubro',
    type: 'select',
    description: 'Nivel de riesgo inherente asociado a la actividad económica principal de la entidad.',
    evaluatorGuide: 'Verifique el código de actividad económica (SII) o la patente comercial. Seleccione la categoría que mejor describa la operación principal del sitio.',
    options: [
      { label: 'Servicios de transporte de pasajeros', value: 8 },
      { label: 'Actividades de entretenimiento adultos', value: 7 },
      { label: 'Servicios de salud', value: 7 },
      { label: 'Almacenamiento y distribución / Logística', value: 6 },
      { label: 'Comercio al por mayor y al por menor', value: 6 },
      { label: 'Servicios básicos', value: 6 },
      { label: 'Servicios de educación', value: 5 },
      { label: 'Sector industrial / Producción', value: 5 },
      { label: 'Servicios de información y telecomunicaciones', value: 4 },
      { label: 'Servicios automotrices', value: 4 },
      { label: 'Servicios financieros y seguros', value: 4 },
      { label: 'Servicios de previsión social', value: 4 },
      { label: 'Servicios públicos', value: 4 },
      { label: 'Servicios de hotelería y turismo', value: 4 },
      { label: 'Actividades de entretenimiento general', value: 3 },
      { label: 'Servicios profesionales, científicos y técnicos', value: 3 },
      { label: 'Otros', value: 3 }
    ]
  },
  {
    id: 'criticidad',
    title: 'Criticidad de las funciones (aditivo)',
    type: 'aditivo-criticidad',
    description: 'Impacto estratégico de la interrupción de las funciones de la entidad.',
    evaluatorGuide: 'Marque todas las que apliquen. "Esencial": provee servicios básicos vitales. "Estratégico": impacto nacional o regional severo. "No sustituible": único proveedor en la zona.',
    options: [
      { label: 'Servicio esencial', value: 4 },
      { label: 'No sustituible', value: 3 },
      { label: 'Sector estratégico', value: 3 }
    ],
    helperText: 'Si no aplica ninguna, el valor será 1.'
  },
  {
    id: 'victimizacion',
    title: 'Victimización por delitos en la entidad',
    type: 'select',
    description: 'Frecuencia histórica de delitos ocurridos dentro o en el perímetro inmediato de la entidad.',
    evaluatorGuide: 'Revise el libro de novedades, partes policiales o denuncias de los últimos 12 meses. "Muy frecuentes": >5 eventos/mes. "Nada frecuente": 0 eventos en 12 meses.',
    options: [
      { label: 'Nada frecuente', value: 1 },
      { label: 'Poco frecuentes', value: 4 },
      { label: 'Algo frecuentes', value: 6 },
      { label: 'Muy frecuentes', value: 10 }
    ]
  },
  {
    id: 'efectivo',
    title: 'Mantención de efectivo (promedio diario)',
    type: 'select-cash',
    description: 'Cantidad promedio de dinero en efectivo mantenido en la instalación (cajas, bóvedas, recaudación).',
    evaluatorGuide: 'Solicite información de arqueos de caja o límites de seguros. Considere el peak promedio diario. Ingrese el monto para cálculo automático.',
    options: [
      { label: '< $2.000.000', value: 1 },
      { label: '$2.000.000 – $4.999.999', value: 2 },
      { label: '$5.000.000 – $9.999.999', value: 4 },
      { label: '$10.000.000 – $14.999.999', value: 6 },
      { label: '≥ $15.000.000', value: 10 }
    ]
  },
  {
    id: 'cualidades',
    title: 'Cualidades atractivas para el delito (aditivo)',
    type: 'aditivo-cualidades',
    description: 'Características de los bienes o especies existentes en la instalación.',
    evaluatorGuide: 'Marque si aplica. "Peligroso": armas, químicos, explosivos. "Alto valor": joyas, tecnología cara. "Transportable": especies fáciles de robar manualmente.',
    options: [
      { label: 'Peligroso', value: 4 },
      { label: 'Alto valor comercial', value: 3 },
      { label: 'Fácilmente transportable', value: 3 }
    ],
    helperText: 'Si no aplica ninguna, el valor será 1.'
  },
  {
    id: 'horario',
    title: 'Horario de funcionamiento (aditivo)',
    type: 'aditivo-horario',
    description: 'Períodos de tiempo en que la entidad se encuentra operativa o vulnerable.',
    evaluatorGuide: 'Marque todas las condiciones operativas. El riesgo aumenta con la operación nocturna y en días inhábiles (fines de semana/festivos).',
    options: [
      { label: 'Nocturno', value: 4 },
      { label: 'Diurno', value: 2 },
      { label: 'Días hábiles', value: 1 },
      { label: 'Días inhábiles', value: 3 }
    ],
    helperText: 'Si no aplica ninguna, el valor será 1.'
  },
  {
    id: 'aforo',
    title: 'Frecuencia alcance aforo máximo',
    type: 'select',
    description: 'Frecuencia con la que la cantidad de personas en el recinto se acerca al límite máximo permitido.',
    evaluatorGuide: 'Observe registros de control de acceso o estime según flujo en horas punta. "Permanentemente": Casi todos los días llega al tope. "Nunca": Rara vez supera el 50%.',
    options: [
      { label: 'Permanentemente', value: 10 },
      { label: 'Frecuentemente', value: 7 },
      { label: 'Algunas veces', value: 5 },
      { label: 'Pocas veces', value: 4 },
      { label: 'Nunca', value: 1 }
    ]
  },
  {
    id: 'publico',
    title: 'Tipo de público',
    type: 'select',
    description: 'Características del flujo de personas que acceden a la entidad.',
    evaluatorGuide: '"Estático": Empleados conocidos/registrados. "Regulado": Visitas con control de identidad. "Dinámico": Público general sin identificación previa (ej. Retail).',
    options: [
      { label: 'Estático', value: 1 },
      { label: 'Regulado', value: 5 },
      { label: 'Dinámico', value: 10 }
    ]
  },
  {
    id: 'coberturaPolicial',
    title: 'Cobertura de Demanda Policial (ICDP)',
    type: 'select',
    description: 'Índice de Cobertura de Demanda Policial de la comuna o sector.',
    evaluatorGuide: 'Basado en estadísticas de Carabineros/PDI para el cuadrante. Si no hay dato exacto, estime según tiempo de respuesta policial: Tramo 6 = Respuesta muy lenta/nula.',
    options: [
      { label: 'Tramo 1 (Bajo Riesgo / Alta Cobertura)', value: 1 },
      { label: 'Tramo 2', value: 3 },
      { label: 'Tramo 3', value: 6 },
      { label: 'Tramo 4', value: 7 },
      { label: 'Tramo 5', value: 8 },
      { label: 'Tramo 6 (Alto Riesgo / Baja Cobertura)', value: 10 }
    ]
  },
  {
    id: 'patrullajeMunicipal',
    title: 'Cobertura patrullaje municipal',
    type: 'select',
    description: 'Frecuencia y presencia de seguridad municipal en el sector.',
    evaluatorGuide: 'Este campo se autocompleta al seleccionar la COMUNA. Decil 1: Muy baja frecuencia (Riesgo 10). Decil 10: Presencia permanente (Riesgo 1).',
    options: [
      { label: 'Decil 1 (Baja presencia)', value: 10 },
      { label: 'Decil 2', value: 9 },
      { label: 'Decil 3', value: 8 },
      { label: 'Decil 4', value: 7 },
      { label: 'Decil 5', value: 6 },
      { label: 'Decil 6', value: 5 },
      { label: 'Decil 7', value: 4 },
      { label: 'Decil 8', value: 3 },
      { label: 'Decil 9', value: 2 },
      { label: 'Decil 10 (Alta presencia)', value: 1 }
    ]
  },
  {
    id: 'vulnerabilidad',
    title: 'Vulnerabilidad socio-delictual (SPD)',
    type: 'select',
    description: 'Índice de Vulnerabilidad Socio-Delictual de la comuna según ranking SPD.',
    evaluatorGuide: 'Este campo se autocompleta al seleccionar la COMUNA en la identificación. Puede desbloquearlo manualmente si el sector específico difiere de la realidad comunal.',
    options: [
      { label: 'Rotativa 2 (Ranking 234-345)', value: 2 },
      { label: 'Rotativa 1 (Ranking 121-233)', value: 4 },
      { label: 'Urgente 3 (Ranking 81-120)', value: 6 },
      { label: 'Urgente 2 (Ranking 41-80)', value: 8 },
      { label: 'Urgente 1 (Ranking 1-40)', value: 10 }
    ]
  },
  {
    id: 'rutasEscape',
    title: 'Proximidad a rutas de escape (aditivo)',
    type: 'aditivo-rutas',
    description: 'Facilidad de huida para delincuentes debido a la conectividad vial.',
    evaluatorGuide: 'Marque si la instalación colinda o está a <500m de estas vías. Facilita la entrada y salida rápida de vehículos delictuales.',
    options: [
      { label: 'Autopista', value: 5 },
      { label: 'Avenida principal', value: 3 },
      { label: 'Zona de alta complejidad', value: 2 }
    ],
    helperText: 'Si no existe cercanía, el valor será 1.'
  }
];

// Reconstructed hierarchy weights
export const WEIGHTS: Record<string, number> = {
  rubro: 0.112,
  criticidad: 0.112,
  victimizacion: 0.056,
  efectivo: 0.063,
  cualidades: 0.147,
  horario: 0.084,
  aforo: 0.063,
  publico: 0.063,
  coberturaPolicial: 0.096,
  patrullajeMunicipal: 0.048,
  vulnerabilidad: 0.096,
  rutasEscape: 0.060
};

// Standardized Findings Chips for Quick Entry (B2B Feature)
export const COMMON_FINDINGS: Record<string, string[]> = {
  rubro: ["Actividad de alto riesgo conforme a Ley", "Rubro crítico para infraestructura crítica", "Giro comercial estándar"],
  criticidad: ["Interrupción afecta continuidad operacional", "Sin redundancia de procesos", "Infraestructura Crítica designada"],
  victimizacion: ["Delitos violentos en último trimestre", "Robos a lugar no habitado frecuentes", "Sin incidentes reportados en 12 meses", "Zona roja según Estadística Oficial"],
  efectivo: ["Recaudación diaria excede límites asegurados", "Caja fuerte sin anclaje certificado", "Manejo de valores por terceros (CIT)", "Sin flujo de efectivo en sitio"],
  cualidades: ["Especies de fácil reducción", "Almacenamiento de sustancias peligrosas", "Inventario de alto valor tecnológico"],
  horario: ["Turno nocturno sin supervisión directa", "Operación 24/7 con control de accesos", "Vulnerable en fines de semana"],
  aforo: ["Control de acceso desbordado en horas punta", "Aglomeraciones frecuentes en acceso", "Flujo controlado por torniquetes"],
  publico: ["Acceso libre sin identificación", "Registro obligatorio de visitas", "Control biométrico implementado"],
  coberturaPolicial: ["Tiempo respuesta > 20 min", "Comisaría a menos de 1km", "Patrullaje preventivo visible"],
  patrullajeMunicipal: ["Ronda municipal cada 2 horas", "Sin presencia municipal en el sector", "Caseta de seguridad municipal cercana"],
  vulnerabilidad: ["Entorno con comercio ambulante", "Luminarias públicas deficientes", "Microtráfico en inmediaciones", "Sitio eriazo colindante"],
  rutasEscape: ["Salida directa a autopista urbana", "Vías de escape múltiples y rápidas", "Calle ciega o acceso único"]
};

// Database of Communes and their Ranking (SPD)
export const COMUNAS_RANKING: Record<string, number> = {
  "Santiago": 1, "Puente Alto": 2, "Valparaíso": 3, "Antofagasta": 4, "Maipú": 5, "San Bernardo": 6, "Arica": 7, "Viña Del Mar": 8, "La Florida": 9, "Recoleta": 10,
  "Temuco": 11, "Coquimbo": 12, "Estación Central": 13, "Puerto Montt": 14, "Alto Hospicio": 15, "Iquique": 16, "La Serena": 17, "Rancagua": 18, "Pudahuel": 19, "La Pintana": 20,
  "Concepción": 21, "Calama": 22, "Los Ángeles": 23, "Quilicura": 24, "Quinta Normal": 25, "Independencia": 26, "Talca": 27, "Peñalolén": 28, "Valdivia": 29, "Cerro Navia": 30,
  "El Bosque": 31, "Copiapó": 32, "Renca": 33, "Chillán": 34, "Lo Prado": 35, "La Granja": 36, "Osorno": 37, "Curicó": 38, "Lo Espejo": 39, "Conchalí": 40,
  "Pedro Aguirre Cerda": 41, "Colina": 42, "Ñuñoa": 43, "Ovalle": 44, "Quilpué": 45, "Melipilla": 46, "San Joaquín": 47, "San Ramón": 48, "Colchane": 49, "La Cisterna": 50,
  "Alto Biobío": 51, "Vallenar": 52, "Lampa": 53, "San Pedro De La Paz": 54, "Cerrillos": 55, "Curarrehue": 56, "San Antonio": 57, "Talcahuano": 58, "Paine": 59, "Putre": 60,
  "San Pedro De Atacama": 61, "Providencia": 62, "Linares": 63, "San Miguel": 64, "Cartagena": 65, "Buin": 66, "Coronel": 67, "Huechuraba": 68, "Padre Las Casas": 69, "Villarrica": 70,
  "San Juan De La Costa": 71, "San Fernando": 72, "Saavedra": 73, "Ercilla": 74, "Nueva Imperial": 75, "Macul": 76, "San Felipe": 77, "Carahue": 78, "Pucón": 79, "Cholchol": 80,
  "Villa Alemana": 81, "Quintero": 82, "Galvarino": 83, "Quillota": 84, "Teodoro Schmidt": 84, "Molina": 86, "El Tabo": 87, "Camarones": 88, "Puchuncaví": 89, "El Quisco": 90,
  "General Lagos": 91, "Camiña": 92, "San Carlos": 93, "Vicuña": 94, "Pozo Almonte": 95, "Mulchén": 96, "San Javier": 97, "Purén": 98, "Talagante": 99, "Huara": 100,
  "Melipeuco": 101, "Curacautín": 102, "Lautaro": 103, "Lonquimay": 104, "Angol": 105, "Gorbea": 106, "Collipulli": 107, "Calera": 108, "El Monte": 109, "Rengo": 110,
  "Tirúa": 111, "Tomé": 112, "Vilcún": 113, "Cañete": 114, "San Fabián": 115, "Panguipulli": 116, "Los Vilos": 117, "Hualpén": 118, "Loncoche": 119, "Santa Bárbara": 120,
  "Freire": 121, "Monte Patria": 122, "Chillán Viejo": 123, "Hualqui": 124, "Quillón": 125, "Yerbas Buenas": 126, "Lebu": 127, "Villa Alegre": 128, "San Clemente": 129, "Parral": 130,
  "Toltén": 131, "Lumaco": 132, "Colbún": 133, "Pica": 134, "Cunco": 135, "La Higuera": 136, "Penco": 137, "Peñaflor": 138, "Paillaco": 139, "Perquenco": 140,
  "Victoria": 141, "La Ligua": 142, "Longaví": 143, "Pitrufquén": 144, "Tierra Amarilla": 145, "Traiguén": 146, "Los Álamos": 147, "Mariquina": 148, "Cauquenes": 149, "Mostazal": 150,
  "Padre Hurtado": 151, "San Ignacio": 152, "Pichilemu": 153, "Maule": 154, "Fresia": 155, "Lanco": 156, "La Unión": 157, "Renaico": 158, "El Carmen": 159, "San Pablo": 160,
  "Queilén": 161, "Constitución": 162, "Coihueco": 163, "Curacaví": 164, "Lota": 165, "Olmué": 166, "Chiguayante": 167, "Chimbarongo": 168, "Ñiquén": 169, "Pinto": 170,
  "Paiguano": 171, "Isla De Maipo": 172, "Bulnes": 173, "Rauco": 174, "Limache": 175, "Putaendo": 176, "Chépica": 177, "Calbuco": 178, "Yumbel": 179, "Cobquecura": 180,
  "Máfil": 181, "Retiro": 182, "Ancud": 183, "Tocopilla": 184, "Ránquil": 185, "Freirina": 186, "Los Andes": 187, "Caldera": 188, "Futrono": 189, "Pelarco": 190,
  "Contulmo": 191, "Puyehue": 192, "Puerto Varas": 193, "Los Muermos": 194, "Los Sauces": 195, "Santa Juana": 196, "Arauco": 197, "Quellón": 198, "Chañaral": 199, "San Vicente": 200,
  "Pelluhue": 201, "Graneros": 202, "Treguaco": 203, "Purranque": 204, "Coyhaique": 205, "Llaillay": 206, "Nancagua": 207, "Mejillones": 208, "Punta Arenas": 209, "Florida": 210,
  "Algarrobo": 211, "Quirihue": 212, "Santa Cruz": 213, "Los Lagos": 214, "Pemuco": 215, "Frutillar": 216, "Teno": 217, "Río Bueno": 218, "Hualañé": 219, "Cabrero": 220,
  "Punitaqui": 221, "Papudo": 222, "Chonchi": 223, "Hijuelas": 224, "Quilleco": 225, "Puerto Octay": 226, "Negrete": 227, "Canela": 228, "Las Condes": 229, "Lago Ranco": 230,
  "Tucapel": 231, "Malloa": 232, "Cochamó": 233, "Petorca": 234, "Paredones": 235, "Río Negro": 236, "Nogales": 237, "Maullín": 238, "Combarbalá": 239, "San José De Maipo": 240,
  "Castro": 241, "Dalcahue": 242, "Isla De Pascua": 243, "Llanquihue": 244, "Quinta De Tilcoco": 245, "Chanco": 246, "Codegua": 247, "Pumanque": 248, "Curaco De Vélez": 249, "Hualaihué": 250,
  "Lolol": 251, "Catemu": 252, "Quinchao": 253, "San Rafael": 254, "Quilaco": 255, "Las Cabras": 256, "Concón": 257, "Navidad": 258, "Pichidegua": 259, "Chile Chico": 260,
  "Antuco": 261, "San Rosendo": 262, "Peralillo": 263, "Sierra Gorda": 264, "Portezuelo": 265, "Santa María": 266, "Huasco": 267, "Corral": 268, "Romeral": 269, "Empedrado": 270,
  "San Nicolás": 271, "San Pedro": 272, "Illapel": 273, "Taltal": 274, "Río Claro": 275, "Placilla": 276, "Litueche": 277, "María Pinto": 278, "Marchihue": 279, "Ollagüe": 280,
  "Aysén": 281, "Panquehue": 282, "Curanilahue": 283, "Laja": 284, "Curepto": 285, "Andacollo": 286, "Alto Del Carmen": 287, "Palmilla": 288, "Río Hurtado": 289, "Nacimiento": 290,
  "Quemchi": 291, "Calera De Tango": 292, "Pencahue": 293, "Coelemu": 294, "La Reina": 295, "Sagrada Familia": 296, "Salamanca": 297, "Casablanca": 298, "Coltauco": 299, "Natales": 300,
  "María Elena": 301, "Coinco": 302, "Cabildo": 303, "Yungay": 304, "Ninhue": 305, "Rinconada": 306, "Olivar": 307, "San Esteban": 308, "Río Ibáñez": 309, "Calle Larga": 310,
  "Peumo": 311, "Pirque": 312, "Licantén": 313, "Requínoa": 314, "Lo Barnechea": 315, "Vichuquén": 316, "Santo Domingo": 317, "Tiltil": 318, "Cisnes": 319, "Doñihue": 320,
  "La Cruz": 321, "Juan Fernández": 322, "Machalí": 323, "Lago Verde": 324, "Palena": 325, "Zapallar": 326, "Cochrane": 327, "Tortel": 328, "Alhué": 329, "Puqueldón": 330,
  "Futaleufú": 331, "Diego De Almagro": 332, "Guaitecas": 333, "O’higgins": 334, "La Estrella": 335, "Porvenir": 336, "Chaitén": 337, "Vitacura": 338, "Timaukel": 339, "Primavera": 340,
  "Torres Del Paine": 341, "San Gregorio": 342, "Cabo De Hornos": 343, "Río Verde": 344, "Laguna Blanca": 345
};

// Database for Municipal Patrol Coverage (Decil)
// Decil 10 = Max Coverage (Low Risk 1). Decil 1 = Min Coverage (High Risk 10).
export const COMUNAS_PATRULLAJE: Record<string, number> = {
  "Estación Central": 10,
  "Renca": 9, "Las Condes": 9, "La Reina": 9, "Viña Del Mar": 9, "Peñalolén": 9, "Puente Alto": 9,
  "Maipú": 8,
  "Pudahuel": 7, "Buin": 7, "Chillán": 7, "Temuco": 7,
  "Lo Barnechea": 6, "Colina": 6,
  "La Serena": 3
};
