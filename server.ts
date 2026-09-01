import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();

  const PORT = Number(process.env.PORT) || 3000;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(express.json({ limit: "20mb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      status: "running",
      port: PORT,
      timestamp: new Date().toISOString()
    });
  });

  app.post("/api/gemini-report", async (req, res) => {
    try {
      const {
        data,
        result,
        config,
        role = "consultant",
        ds209Result,
        ds209Measures,
        ds209Protocols
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

      if (!apiKey) {
        return res.status(500).json({
          ok: false,
          error:
            "Clave GEMINI_API_KEY no configurada en el servidor. Configure la variable de entorno GEMINI_API_KEY."
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const matrixDetails = (result?.details || [])
        .map(
          (d: any) =>
            `- INDICADOR NORMADO: ${d.title}
PUNTAJE: ${d.value}/10
HALLAZGO DE CAMPO: "${
              data?.observations?.[d.id] ||
              "Sin observaciones específicas registradas."
            }"`
        )
        .join("\n\n");

      const measuresText = (ds209Measures || [])
        .map(
          (m: any) =>
            `[PRIORIDAD ${m.prioridad}] Dimensión: ${m.dimension} | Brecha: ${m.brecha} | Medida Correctiva: ${m.medida} | Fundamento: ${m.fundamento} | Plazo: ${m.plazoSugerido}`
        )
        .join("\n");

      const protocolsText = (ds209Protocols || [])
        .map(
          (p: any) =>
            `- ${p.nombreProtocolo}: Estado ${p.estado} | Contenido mínimo: ${p.contenidoMinimo}`
        )
        .join("\n");

      const actionPlanText = (data?.actionPlan || [])
        .map(
          (act: any) =>
            `- [PRIORIDAD ${act.priority?.toUpperCase?.() || 'MEDIA'}] ${act.title} | Categoría: ${act.category} | Estado: ${act.status} (${act.progress}%) | Quién Ejecuta/Mitiga: ${act.executor || 'FACTOR PROTEGE'} | Responsable Cliente: ${act.responsible} | Venta/Resultado Comercial: ${act.commercialOutcome || 'cotizado'} (${formatCLP(act.opportunityValue || act.budgetEstimate || 0)}) | Plazo: ${act.dueDate} | Presupuesto: ${formatCLP(act.budgetEstimate || 0)} | Acción: ${act.actionRequired}`
        )
        .join("\n");

      const formatCLP = (val: number) => {
        return new Intl.NumberFormat("es-CL", {
          style: "currency",
          currency: "CLP",
          maximumFractionDigits: 0
        }).format(Number.isFinite(val) ? val : 0);
      };

      const systemPrompt = `Eres un Asesor Consultor Senior de Seguridad del más alto nivel jerárquico en Chile y especialista corporativo en la Ley N° 21.659 de Seguridad Privada, el Decreto Supremo N° 209 y la Resolución Exenta N° 1.820 de la Prefectura de Seguridad Privada de Carabineros de Chile (OS10). 

Tu misión es elaborar estudios técnicos rigurosos, con un lenguaje formal, técnico-jurídico y de ingeniería de seguridad que demuestre maestría técnica, análisis forense, justificación de datos estadísticos y operacionales precisos. 

CRITERIOS ESTRICTOS DE REDACCIÓN:
1. No utilices caracteres de formato markdown o de texto enriquecido bajo ninguna circunstancia. Está STRICTLY FORBIDDEN usar asteriscos (**), almohadillas o numerales (#), guiones bajos (_), o corchetes decorativos. El reporte no debe tener asteriscos ni numerales. Si deseas destacar un concepto, escríbelo en MAYÚSCULAS o entrecomillado. Usa párrafos limpios.
2. Utiliza nomenclatura formal reglamentaria (por ejemplo, referenciar artículos del Reglamento de Seguridad Privada, citar la Ley de Seguridad Privada o el Decreto Supremo N° 209 de manera fluida y solvente).
3. Entrega especificaciones técnicas reales, de nivel senior de ingeniería: por ejemplo, al sugerir cámaras, menciona sensores de alta definición (mínimo 4MP), iluminadores infrarrojos inteligentes con rango de 30 metros, grabadores NVR acorazados o almacenamiento redundante RAID 1; al hablar de perímetros, menciona cercos metálicos galvanizados con concertina helicoidal de 450 mm de diámetro o sensores microfónicos de vibración perimetral; al sugerir vidrios de seguridad, indica clasificación de resistencia de película o multilaminados según normativa chilena.
4. Desarrolla análisis cualitativos y cuantitativos detallados de los riesgos, justificando el impacto financiero y de continuidad operacional de las vulnerabilidades encontradas.
5. Usa espaciados y saltos de párrafo estructurados para asegurar una legibilidad de informe gerencial impecable. Genera un contenido denso, extenso y de alto valor profesional para cada sección.`;

      const prompt = `TAREA: Redactar un ESTUDIO DE SEGURIDAD PRIVADA Y DICTAMEN DE VULNERABILIDADES DE NIVEL SENIOR, con un sustento analítico impecable y propuestas técnicas avanzadas, estructurado rigurosamente para la instalación detallada abajo.

ANTECEDENTES METROLÓGICOS Y OPERACIONALES DE LA INSTALACIÓN:
- Razón Social: ${data?.entidad || "No informado"}
- RUT: ${data?.rut || "No informado"}
- Giro / Actividad Principal: ${data?.giro || "No informado"}
- Dirección Física: ${data?.direccion || "No informado"}
- Comuna y Región: ${data?.comuna || "No informado"}, ${data?.region || "Metropolitana"}
- Representante Legal: ${data?.representanteLegal || "No informado"}
- Tipo de Categoría de Entidad: ${data?.tipoEntidad || "Establecimiento comercial de media-alta densidad"}
- Dimensión del Predio (Terreno): ${data?.superficieTerreno || 0} m2
- Área Edificada Consolidada: ${data?.superficieConstruida || 0} m2
- Valor Total Estimado de Activos Custodiados: ${formatCLP(Number(data?.valorActivos || 0))}
- Flujo Nominal de Efectivo Diario: ${formatCLP(Number(data?.flujoEfectivo || 0))}
- Horario de Operación: ${data?.horarioFuncionamiento || "S/I"}
- Período de Mayor Afluencia de Público: ${data?.horarioMayorAfluencia || "S/I"}
- Exposición Operativa Nocturna: ${data?.operaNocturno || "NO"}
- Dotación de Personal Interno: ${data?.trabajadores || 0} colaboradores directos
- Afluencia Diaria Promedio de Usuarios/Clientes: ${data?.afluenciaDiaria || 0} personas

EVALUACIÓN CUANTITATIVA DEL RIESGO - RESOLUCIÓN EXENTA N° 1.820 OS10:
- Score Ponderado del Riesgo Normativo: ${result?.score?.toFixed?.(2) || result?.score || "S/I"} sobre un máximo de 10.00 puntos.
- Diagnóstico de Clasificación Corporativa: Nivel de Riesgo ${result?.classification?.toUpperCase?.() || result?.classification || "S/I"}.

DIAGNÓSTICO FORMAL BAJO EL ALCANCE DEL DECRETO SUPREMO N° 209:
- Índice de Vulnerabilidad Física-Operativa: ${ds209Result?.score || 0} de un total de 36.00 puntos posibles.
- Grado de Exposición DS 209: ${ds209Result?.categoriaDS209 || "S/I"}.
- Dictamen de Campo Fundacional: "${ds209Result?.fundamento || "Requiere levantamiento forense de medidas perimetrales."}"

REPORTE DE BRECHAS RECURRENTES Y EXIGENCIAS OPERATIVAS DETECTADAS:
${measuresText || "No se reportan fallas o brechas críticas inmediatas."}

INVENTARIO DE PROTOCOLOS DE EMERGENCIAS Y CONTINGENCIAS MINIMOS:
${protocolsText || "Falta de formalización de protocolos operacionales normalizados de reacción."}

PLAN DE ACCIÓN Y SEGUIMIENTO DE MEDIDAS MITIGADORAS PROGRAMADAS:
${actionPlanText || "No hay un plan de acción de mitigación cargado explícitamente."}

INFORMACIÓN ADICIONAL DE CONTEXTO INTEGRADOR:
- Historial Táctico y Estadísticas Delictuales de la Zona: ${config?.crimeStats || "No especificado"}
- Atributos del Entorno Inmediato y Colindancias: ${config?.surroundings || "No especificado"}
- Contextualización Histórica del Predio: ${config?.historicalContext || "Primera auditoría de seguridad estructural bajo la nueva ley."}
- Perfil Jerárquico del Evaluador / Auditor: ${role.toUpperCase()} experto en gestión de riesgos de activos críticos.

REGLAS DE FORMATO DEL REPORTE:
- NUNCA uses asteriscos, guiones de formato markdown, almohadillas o decoraciones visuales de código. El texto debe estar perfectamente limpio y apto para impresión directa.
- Usa los siguientes títulos en mayúsculas como las únicas cabeceras del informe.
- Desarrolla cada capítulo profusamente, proporcionando argumentos de ingeniería, recomendaciones de marcas de referencia tácticas, justificaciones legales asociadas a la Ley Nº 21.659 y OS10 de Chile, y referencias métricas completas basadas en los datos de la instalación.

ESTRUCTURA OBLIGATORIA DEL DOCUMENTO:

I. RESUMEN EJECUTIVO Y ANTECEDENTES GENERALES DE LA COMPAÑÍA
- Elabora una introducción ejecutiva impecablemente formal sobre la situación de cumplimiento normativo de la instalación de ${data?.entidad || "la empresa"}.
- Fundamenta la importancia de ajustar la operación comercial de la instalación (giro, flujos financieros de ${formatCLP(Number(data?.flujoEfectivo || 0))}, y activos totales valorados en ${formatCLP(Number(data?.valorActivos || 0))}) a la nueva gobernanza legal dictaminada por la Ley N° 21.659 de Seguridad Privada.
- Detalla los desafíos que impone la ubicación en la comuna de ${data?.comuna || "la comuna señalada"} en conjunto con el entorno de colindancias y de seguridad analizados.

II. EVALUACIÓN DE FACTORES DE RIESGO DE LA RESOLUCIÓN EXENTA N° 1.820 (OS10)
- Explica detalladamente la ponderación obtenida de ${result?.score?.toFixed?.(2)} sobre 10.00, y lo que representa clasificar en rango de riesgo ${result?.classification?.toUpperCase?.()}.
- Analiza con criterio de especialista cada uno de los siguientes sub-indicadores del levantamiento técnico de campo de la Resolución 1820:
${matrixDetails || "No se registran diagnósticos en el tablero analítico corporativo."}
- Explica el impacto que ejerce cada brecha sobre la probabilidad de ser objeto de delitos de mayor connotación social, considerando el flujo diario de ${data?.afluenciaDiaria || 0} personas y la operación en rango horario de ${data?.horarioFuncionamiento || "S/I"}.

III. INFORME DE VULNERABILIDADES DE SEGURIDAD FÍSICA Y TECNOLÓGICA (DS N° 209)
- Diagnóstica con excelencia la vulnerabilidad de la infraestructura y barreras físicas a partir del puntaje integrado de ${ds209Result?.score} sobre 36.00 puntos, lo que denota una categoría de exposición de grado ${ds209Result?.categoriaDS209 || "S/I"}.
- Desglose con visión forense los puntos de debilidad recurrentes en los componentes:
  A) Control de accesos y flujo perimetral (analizar vulnerabilidades en portones, esclusas, torniquetes y validación de visitas/proveedores).
  B) Cierre perimetral y concertinas (analizar el estado físico de los cierres, resistencia estructural del metal, altura física útil, y si posee elementos disuasivos tipo concertinas o cercos eléctricos homologados SEC).
  C) Puntos ciegos físicos o de CCTV y zonas de sombra de cobertura de iluminación de seguridad del predio de ${data?.superficieTerreno || 0} m2.
  D) Sistemas de prevención activos y de alerta (alarmas, barreras de humo activo, sensores sísmicos de bóveda en zonas vulnerables, cañones de niebla disuasivos).
  E) Entorno geográfico inmediato y rutas de escape urbanas (vías de alta velocidad colindantes, accesibilidad vehicular, proximidad de servicios policiales).
  F) Dotación humana y guardias OS10 (roles, Turnos e importancia de acreditar vigilantes de seguridad idóneos).

IV. ANÁLISIS DE BRECHAS OPERACIONALES Y PLAN DE ACCIÓN DE INVERSIÓN (CAPEX Y OPEX)
- Describe detalladamente el plan de acción sugerido para consolidar las medidas de control correspondientes.
- Expone los requerimientos prioritarios sobre seguridad física perimetral e interior, aportando especificaciones de nivel superior (CCTV de mínimo 4MP con analíticas inteligentes de intrusión perimetral por cruce de línea, cercos de concertina galvanizada reforzada, chapas electromagnéticas con retención de 1200 libras en puertas críticas, etc.).
- Vincula de manera explícita cada recomendación técnica a las siguientes brechas reales informadas:
${measuresText || "Carencia de fallas críticas informadas; proponer un plan preventivo de robustecimiento defensivo general."}

V. ANÁLISIS DE PROTOCOLOS DE REACCIÓN INTERNA Y GOBERNANZA DE SEGURIDAD
- Analiza minuciosamente el estado actual de los protocolos básicos operacionales establecidos por la normativa en relación con el listado oficial:
${protocolsText || "Ausencia de protocolos de emergencia reglamentarios."}
- Entrega directrices operacionales concretas para estructurar o perfeccionar los procedimientos de respuesta ante contingencias (ej: procedimiento ante asalto a mano armada, plan de evacuación, protocolo de intrusión activa nocturna, y coordinación técnica directa con la Central de Carabineros de Chile o Plan de Cuadrante Local).

VI. CONCLUSIONES Y RECOMENDACIÓN FORMAL DE APROBACIÓN TÉCNICA
- Cierra el informe con una síntesis pericial técnica del Consultor Experto en Seguridad.
- Genera recomendaciones explícitas para el Representante Legal, ${data?.representanteLegal || "no informado"}, con plazos perentorios para la presentación legal del Estudio ante la Autoridad Fiscalizadora de Carabineros de Chile (Prefectura OS10 correspondiente), garantizando el cumplimiento estricto de la Ley N° 21.659 y disminuyendo el riesgo de multas institucionales severas de beneficio fiscal.`;

      let response;
      const modelsToTry = [
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest"
      ];

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      let lastError: any = null;

      for (const currentModel of modelsToTry) {
        let attempts = 0;
        const maxAttempts = 2;
        let success = false;

        while (attempts < maxAttempts) {
          try {
            console.log(`Intentando generación de informe con ${currentModel} (intento ${attempts + 1})...`);
            response = await ai.models.generateContent({
              model: currentModel,
              contents: prompt,
              config: {
                systemInstruction: systemPrompt,
                temperature: 0.15
              }
            });
            if (response && response.text) {
              console.log(`Éxito con modelo ${currentModel}`);
              success = true;
              break;
            }
          } catch (err: any) {
            lastError = err;
            attempts++;
            const errMsg = err?.message || "";
            const is503 = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || (err?.status === 503);
            if (is503 && attempts < maxAttempts) {
              console.warn(`Model ${currentModel} con alta demanda temporal (503). Reintentando en 1500ms...`);
              await delay(1500);
            } else {
              console.warn(`Intento fallido para ${currentModel}: ${errMsg}`);
              break;
            }
          }
        }
        if (success) break;
      }

      if (!response || !response.text) {
        throw lastError || new Error("No se pudo obtener una respuesta válida del backend de Inteligencia Artificial debido a alta demanda de servidores.");
      }

      if (!response.text) {
        throw new Error("No se recibió respuesta en texto desde Gemini.");
      }

      return res.status(200).json({
        ok: true,
        report: response.text
      });
    } catch (err: any) {
      console.error("Error en /api/gemini-report:", err);

      return res.status(500).json({
        ok: false,
        error: err?.message || "Error desconocido al generar el informe."
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0"
      },
      appType: "spa"
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");

    app.use(express.static(distPath));

    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor iniciado correctamente en 0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error crítico al iniciar el servidor:", err);
  process.exit(1);
});