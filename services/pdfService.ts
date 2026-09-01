import { RiskData, CalculationResult } from '../types';
import { calculateDS209Risk, generateDS209Measures } from '../utils';

const COLORS = {
  primary: [25, 103, 210],    // Google dark brand blue (azul corporativo)
  secondary: [26, 115, 232],  // Google brand blue (azul estándar)
  text: [32, 33, 36],         // Off-black charcoal
  muted: [95, 99, 104],       // Gray text
  danger: [217, 48, 37],     // Google Red (Rojo riesgo)
  warning: [249, 171, 0],    // Google Yellow (Amarillo brecha)
  success: [30, 142, 62],    // Google Green (Verde seguro)
  light: [248, 249, 250],    // Light cool gray
  border: [218, 220, 224]    // Light gray border
};

const stripMarkdown = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .replace(/_/g, '')
    .trim();
};

/**
 * Función robusta para determinar si una línea del reporte actúa como un encabezado o sección
 */
const isReportTitle = (originalLine: string, cleanedLine: string): boolean => {
  const trimmed = originalLine.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('##') || trimmed.startsWith('###')) {
    return true;
  }

  // Títulos con nomenclatura romana tipo "I. RESUMEN EJECUTIVO..."
  const romanPattern = /^[IVXLCDM]+\.\s+\w+/i;
  if (romanPattern.test(cleanedLine)) {
    return true;
  }

  // Títulos numerados tipo "1.", "2.4", etc.
  const arabicPattern = /^\d+(\.\d+)*\.\s+\w+/i;
  if (arabicPattern.test(cleanedLine)) {
    return true;
  }

  // Líneas cortas mayúsculas que terminan en dos puntos o punto
  if (cleanedLine.length < 80 && (cleanedLine.endsWith(':') || cleanedLine.endsWith('.'))) {
    if (cleanedLine === cleanedLine.toUpperCase() && cleanedLine.length > 5) {
      return true;
    }
  }

  // Líneas de ancho muy moderado que estén redactadas completamente en MAYÚSCULAS
  if (cleanedLine.length < 60 && cleanedLine === cleanedLine.toUpperCase() && cleanedLine.length > 3) {
    return true;
  }

  return false;
};

export const generatePDFBlob = async (
  data: RiskData,
  result: CalculationResult,
  reportText: string,
  chartsElementId: string
): Promise<string> => {
  const { jspdf } = window;
  const doc = new jspdf.jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 60; // Margen institucional ideal
  const contentWidth = pageWidth - (margin * 2);
  let currentY = 50;

  // Formato chileno de moneda
  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      // Dibujar cenefa superior sutil en páginas subsiguientes
      doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.rect(0, 0, pageWidth, 5, 'F');
      currentY = margin + 15;
      return true;
    }
    return false;
  };

  const addSectionHeader = (text: string) => {
    checkPageBreak(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text(stripMarkdown(text).toUpperCase(), margin, currentY);
    currentY += 12;
    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setLineWidth(1.0);
    doc.line(margin, currentY, margin + 45, currentY);
    currentY += 28;
  };

  /**
   * Función integrada con control línea por línea para justificar texto
   */
  const drawJustifiedText = (text: string, x: number, y: number, width: number, fontSize: number, isFirstLine: boolean = true): number => {
    doc.setFontSize(fontSize);
    const words = text.split(/\s+/);
    let lines: string[][] = [[]];
    let currentLineY = y;
    const indent = isFirstLine ? 20 : 0; // Sangría en el inicio

    // Organizar palabras en renglones
    words.forEach(word => {
      const lastLine = lines[lines.length - 1];
      const testLine = lastLine.length === 0 ? word : lastLine.join(' ') + ' ' + word;
      const testWidth = doc.getTextWidth(testLine) + (lastLine.length === 0 && lines.length === 1 ? indent : 0);

      if (testWidth < width) {
        lastLine.push(word);
      } else {
        lines.push([word]);
      }
    });

    // Imprimir renglón por renglón con control dinámico de salto de página
    lines.forEach((lineWords, idx) => {
      const isLastLineOfParagraph = idx === lines.length - 1;
      const lineX = x + (idx === 0 && isFirstLine ? indent : 0);
      const availableWidth = width - (idx === 0 && isFirstLine ? indent : 0);

      // Salto de página línea por línea
      if (currentLineY + fontSize * 1.8 > pageHeight - margin - 30) {
        doc.addPage();
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.rect(0, 0, pageWidth, 5, 'F');
        currentLineY = margin + 15;
      }

      if (isLastLineOfParagraph || lineWords.length === 1) {
        doc.text(lineWords.join(' '), lineX, currentLineY);
      } else {
        const totalWordsWidth = lineWords.reduce((sum, word) => sum + doc.getTextWidth(word), 0);
        const spaceToDistribute = availableWidth - totalWordsWidth;
        const spacePerGap = spaceToDistribute / (lineWords.length - 1);

        let wordX = lineX;
        lineWords.forEach((word) => {
          doc.text(word, wordX, currentLineY);
          wordX += doc.getTextWidth(word) + spacePerGap;
        });
      }
      currentLineY += fontSize * 1.5; // Interlineado de 1.5
    });

    return currentLineY;
  };

  // 1. CARÁTULA CORPORATIVA Y ANTECEDENTES GENERALES
  // Encabezado decorativo institucional
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, pageWidth, 110, 'F');
  
  // Sello corporativo en carátula
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("ESTUDIO TÉCNICO DE SEGURIDAD PRIVADA", margin, 52);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`CONSOLIDADO DE CUMPLIMIENTO LEY N° 21.659 Y DECRETO SUPREMO N° 209 | FACTOR PROTEGE BI`, margin, 72);
  doc.text(`MÁXIMA CONFIDENCIALIDAD COPIA PRIVADA`, margin, 85);
  
  currentY = 150;

  addSectionHeader("1. ANTECEDENTES GENERALES DE LA INSTALACIÓN");
  
  // Antecedentes legales estructurados en tabla de dos columnas
  const idRowsLeft = [
    ["Razón Social", data.entidad || "S/I"],
    ["RUT Corporativo", data.rut || "S/I"],
    ["Representante Legal", data.representanteLegal || "S/I"],
    ["Región Geográfica", data.region || "Región Metropolitana de Santiago"],
    ["Comuna Emplazamiento", data.comuna || "S/I"]
  ];

  const idRowsRight = [
    ["Dirección Física", data.direccion || "S/I"],
    ["Giro de Operación", data.tipoEntidad || "Establecimiento Comercial"],
    ["Volumen de Activos", formatCLP(Number(data.valorActivos || 0))],
    ["Efectivo Diario Prom.", formatCLP(Number(data.flujoEfectivo || 0))],
    ["Evaluador Técnico", data.auditorName || "S/I"]
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text("DATOS IDENTIFICATORIOS:", margin, currentY);
  currentY += 20;

  const colWidth = contentWidth / 2;
  const startY = currentY;

  // Renderizar Columna Izquierda
  let leftY = startY;
  idRowsLeft.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(k + ":", margin, leftY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(String(v), margin + 105, leftY);
    leftY += 19;
  });

  // Renderizar Columna Derecha
  let rightY = startY;
  idRowsRight.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(k + ":", margin + colWidth - 10, rightY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(String(v), margin + colWidth + 95, rightY);
    rightY += 19;
  });

  currentY = Math.max(leftY, rightY) + 20;

  // Recuadro de Metas Operacionales Perimetrales
  checkPageBreak(80);
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, currentY, contentWidth, 55, 6, 6, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text("MÉTRICAS DEL TERRENO CUSTODIADO", margin + 15, currentY + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`Superficie del Terreno Perimetral: ${data.superficieTerreno || 0} m²`, margin + 15, currentY + 35);
  doc.text(`Superficie de Construcción Techada: ${data.superficieConstruida || 0} m²`, margin + 220, currentY + 35);
  doc.text(`Horario de Funcionamiento Com Decl.: ${data.horarioFuncionamiento || "S/I"}`, margin + 15, currentY + 46);
  doc.text(`Dotación de Guardias Prevista: ${data.guardias || 0} Operativos por turno`, margin + 220, currentY + 46);

  currentY += 90;

  // 2. DASHBOARD DE RIESGOS NORMATIVOS RESOLUCIÓN 1820 (TABLERO VECTORIAL IMPECABLE)
  addSectionHeader("2. EVALUACIÓN ESTADÍSTICA DEL RIESGO (RESOLUCIÓN EXENTA N° 1.820)");
  
  checkPageBreak(280);
  
  // Fondo de tarjeta unificada
  const panelH = 240;
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, currentY, contentWidth, panelH, 8, 8, 'F');
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, currentY, contentWidth, panelH, 8, 8, 'S');

  const panelMargin = 15;
  const leftColX = margin + panelMargin;
  const colW = (contentWidth - (panelMargin * 3)) / 2;
  const rightColX = leftColX + colW + panelMargin;
  let panelY = currentY + panelMargin;

  // Columna Izquierda: Puntaje y Origen de Amenazas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text("PUNTAJE GENERAL Y ORIGEN DE AMENAZAS", leftColX, panelY + 10);

  // Puntaje Grande
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  const scoreRounded = Math.round(result.score);
  const scoreColor = scoreRounded >= 8 ? COLORS.danger : scoreRounded >= 5 ? COLORS.warning : COLORS.success;
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(result.score.toFixed(2), leftColX, panelY + 45);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`DE 10.00 PUNTOS - RIESGO ${result.classification.toUpperCase()}`, leftColX + 80, panelY + 32);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text("ÍNDICE DE INCIDENCIA NORMATIVA GENERAL", leftColX + 80, panelY + 43);

  // Barra de Calibración de Riesgo
  const gaugeW = colW;
  const gaugeY = panelY + 58;
  const gaugeH = 9;
  
  // Zonas de calibración
  const lowW = gaugeW * 0.4;
  doc.setFillColor(230, 244, 234); // soft green
  doc.rect(leftColX, gaugeY, lowW, gaugeH, 'F');
  
  const medW = gaugeW * 0.3;
  doc.setFillColor(254, 247, 224); // soft yellow
  doc.rect(leftColX + lowW, gaugeY, medW, gaugeH, 'F');
  
  const highW = gaugeW * 0.3;
  doc.setFillColor(252, 232, 230); // soft red
  doc.rect(leftColX + lowW + medW, gaugeY, highW, gaugeH, 'F');

  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.setLineWidth(0.5);
  doc.rect(leftColX, gaugeY, gaugeW, gaugeH, 'S');

  // Indicador de la posición actual del score
  const pointerX = leftColX + (result.score / 10) * gaugeW;
  doc.setFillColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.triangle(pointerX, gaugeY - 1, pointerX - 3.5, gaugeY - 5, pointerX + 3.5, gaugeY - 5, 'F');
  doc.rect(pointerX - 0.5, gaugeY, 1, gaugeH, 'F');

  // Etiquetas de la barra de calibración
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text("0.0", leftColX, gaugeY + 16);
  doc.text("BAJO", leftColX + 15, gaugeY + 16);
  doc.text("4.0", leftColX + lowW - 5, gaugeY + 16);
  doc.text("MEDIO", leftColX + lowW + 12, gaugeY + 16);
  doc.text("7.0", leftColX + lowW + medW - 5, gaugeY + 16);
  doc.text("ALTO", leftColX + lowW + medW + 12, gaugeY + 16);
  doc.text("10.0", leftColX + gaugeW - 10, gaugeY + 16);

  // Desglose de origen (Internos v/s Externos)
  const threatY = panelY + 110;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text("ORIGEN DE FACTORES DE AMENAZA", leftColX, threatY);

  const totalWeight = result.details.reduce((acc, curr) => acc + curr.contribution, 0) || 1;
  const externalWeight = result.details
    .filter(d => ['victimizacion', 'coberturaPolicial', 'patrullajeMunicipal', 'vulnerabilidad', 'rutasEscape'].includes(d.id))
    .reduce((acc, curr) => acc + curr.contribution, 0);
  const internalWeight = totalWeight - externalWeight;
  const externalPct = (externalWeight / totalWeight) * 100;
  const internalPct = 100 - externalPct;

  const threatBarH = 10;
  const extBarW = (externalPct / 100) * colW;
  
  // Barra externa azul
  doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
  doc.rect(leftColX, threatY + 10, extBarW, threatBarH, 'F');
  // Barra interna verde
  doc.setFillColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
  doc.rect(leftColX + extBarW, threatY + 10, colW - extBarW, threatBarH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`EXTERNOS: ${externalPct.toFixed(1)}%`, leftColX, threatY + 30);
  doc.text(`INTERNOS: ${internalPct.toFixed(1)}%`, leftColX + colW - 65, threatY + 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text("Vulnerabilidad del entorno inmediato.", leftColX, threatY + 38);
  doc.text("Giro comercial, transacciones y activos.", leftColX + colW - 75, threatY + 38);

  // Columna Derecha: Factores Críticos con Mayor Incidencia
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text("FACTORES CON MAYOR EXPOSICIÓN NORMATIVA", rightColX, panelY + 10);

  const topDetails = [...result.details]
    .sort((a, b) => b.contributionPct - a.contributionPct)
    .slice(0, 5);

  let barY = panelY + 28;
  topDetails.forEach((d) => {
    // Nombre del factor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(truncateString(d.title, 34), rightColX, barY);

    // Contribución porcentual
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(`${d.contributionPct.toFixed(1)}%`, rightColX + colW - 32, barY);

    // Barra de contribución
    const factorBarW = colW - 40;
    const filledW = (d.contributionPct / 100) * factorBarW;
    const factorColor = d.value >= 8 ? COLORS.danger : d.value >= 5 ? COLORS.warning : COLORS.success;

    doc.setFillColor(235, 237, 240);
    doc.rect(rightColX, barY + 4, factorBarW, 4, 'F');
    doc.setFillColor(factorColor[0], factorColor[1], factorColor[2]);
    doc.rect(rightColX, barY + 4, Math.max(1, filledW), 4, 'F');

    // Valor individual
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(factorColor[0], factorColor[1], factorColor[2]);
    doc.text(`${d.value}/10`, rightColX + colW - 12, barY + 7);

    barY += 38;
  });

  currentY += panelH + 35;

  // Resumen Ejecutivo abreviado de la 1820
  checkPageBreak(70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text(`El resultado ponderado de la Matriz Resolución 1820 es de ${result.score.toFixed(2)} de un total de 10.00 puntos, lo`, margin, currentY);
  doc.text(`que clasifica técnicamente a la instalación dentro del rango de Riesgo ${result.classification.toUpperCase()}.`, margin, currentY + 12);
  currentY += 45;

  // 3. SECCIÓN DS 209 VULNERABILIDAD FÍSICA Y OPERATIVA (NATIVO Y DETALLADO)
  doc.addPage();
  currentY = margin;
  addSectionHeader("3. DIAGNÓSTICO DE VULNERABILIDAD FÍSICA-OPERATIVA (DS N° 209)");

  const ds209Result = calculateDS209Risk(data);
  const badgeColor = ds209Result.classification === 'Alto' ? COLORS.danger : 
                     ds209Result.classification === 'Medio' ? COLORS.warning : COLORS.success;

  // Tarjeta de Puntaje Consolidado DS 209
  checkPageBreak(100);
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, currentY, contentWidth, 75, 8, 8, 'F');

  // Borde código de color
  doc.setDrawColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.setLineWidth(1.5);
  doc.line(margin, currentY + 2, margin, currentY + 73);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text("PUNTAJE INTEGRADO DE VULNERABILIDAD DS N° 209:", margin + 15, currentY + 22);

  doc.setFontSize(16);
  doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.text(`${ds209Result.score} / 36`, margin + 15, currentY + 43);
  doc.setFontSize(7.5);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text("PUNTOS TOTALES SEGÚN PONDERADOR REGLAMENTARIO", margin + 15, currentY + 54);

  // Badge de clasificación de vulnerabilidad
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.roundedRect(margin + contentWidth - 195, currentY + 18, 180, 42, 4, 4, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`RIESGO ${ds209Result.classification.toUpperCase()}`, margin + contentWidth - 105, currentY + 34, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text(ds209Result.categoriaDS209.toUpperCase(), margin + contentWidth - 105, currentY + 44, { align: 'center' });

  currentY += 105;

  // Dimensiones Técnicas Reglamentarias
  checkPageBreak(250);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text("VULNERABILIDAD POR DIMENSIONES TÉCNICAS REGLAMENTARIAS (DS N° 209)", margin, currentY);
  currentY += 22;

  const dims = [
    { name: 'VALOR DE ACTIVOS CUSTODIADOS', score: ds209Result.pActivos },
    { name: 'AFLUENCIA PERSONAL / OPERACIÓN', score: ds209Result.pPersonas },
    { name: 'FLUJO DE EFECTIVO DIARIO', score: ds209Result.pEfectivo },
    { name: 'FACTORES CLASIFICATORIOS ENTORNO', score: ds209Result.pEntorno },
    { name: 'SEGURIDAD FÍSICA Y BARRERAS', score: ds209Result.pVulFisica },
    { name: 'CCTV, ALARMAS Y TECNOLOGÍA', score: ds209Result.pVulTec },
    { name: 'OS10, GUARDIAS Y SEG. HUMANA', score: ds209Result.pVulHumana },
    { name: 'DIRECCIÓN Y PROTOCOLOS REACCIÓN', score: ds209Result.pProtocolo }
  ];

  const cardW = (contentWidth - 15) / 2;
  const cardH = 48;
  const rowGap = 12;

  // Renderizar tarjetas con control exacto de alineación
  for (let i = 0; i < dims.length; i++) {
    const d = dims[i];
    const row = Math.floor(i / 2);
    const col = i % 2;

    // Verificar el salto de página solo al comienzo de la fila (col === 0)
    if (col === 0) {
      checkPageBreak(cardH + rowGap);
    }

    const itemX = margin + col * (cardW + 15);
    const itemY = currentY;

    // Caja de la dimensión
    doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
    doc.roundedRect(itemX, itemY, cardW, cardH, 4, 4, 'F');
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(itemX, itemY, cardW, cardH, 4, 4, 'S');

    // Título y Puntajes de la dimensión
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text(d.name, itemX + 10, itemY + 16);

    doc.setFontSize(8.5);
    const dimScoreColor = d.score >= 3.5 ? COLORS.danger : d.score >= 2.5 ? COLORS.warning : COLORS.success;
    doc.setTextColor(dimScoreColor[0], dimScoreColor[1], dimScoreColor[2]);
    doc.text(`${d.score.toFixed(1)} / 4.0`, itemX + cardW - 48, itemY + 16);

    // Barra vectorial de progreso
    doc.setFillColor(218, 220, 224);
    doc.rect(itemX + 10, itemY + 28, cardW - 20, 5, 'F');

    const progressWidth = (d.score / 4) * (cardW - 20);
    doc.setFillColor(dimScoreColor[0], dimScoreColor[1], dimScoreColor[2]);
    doc.rect(itemX + 10, itemY + 28, Math.max(2, progressWidth), 5, 'F');
    
    // Etiqueta cualitativa
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    const qualText = d.score >= 3.5 ? 'EXPOSICIÓN CRÍTICA' : d.score >= 2.5 ? 'EXPOSICIÓN MODERADA' : 'EXPOSICIÓN MÍNIMA / CONTROLADA';
    doc.text(qualText, itemX + 10, itemY + 41);

    // Avanzar el Y del panel de control al terminar la fila o el último elemento
    if (col === 1 || i === dims.length - 1) {
      currentY += cardH + rowGap;
    }
  }

  currentY += 15;

  // Fundamento Técnico DS 209
  checkPageBreak(120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text("DICTAMEN TÉCNICO COMPLEMENTARIO DS N° 209:", margin, currentY);
  currentY += 16;
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  currentY = drawJustifiedText(ds209Result.fundamento, margin, currentY, contentWidth, 8.5, false);
  currentY += 25;

  // Add captured vulnerability photos if any exist
  const vulnerabilityPhotos = data.vulnerabilityPhotos || {};
  const activePhotos = Object.entries(vulnerabilityPhotos).filter(([_, url]) => !!url);

  if (activePhotos.length > 0) {
    const fieldTitles: Record<string, string> = {
      controlAccesos: 'Control de Accesos',
      cierrePerimetral: 'Cierre Perimetral y Concertinas',
      puntosCiegos: 'Puntos Ciegos Detectados',
      sistemasPrevAlarma: 'Sistemas Adicionales y Alarmas',
      entorno: 'Factores de Riesgo del Entorno',
      rutasEscape: 'Vías y Rutas de Escape',
      delitosFrecuentes: 'Análisis de Delitos de Mayor Frecuencia',
      observaciones: 'Observaciones Finales de Campo'
    };

    checkPageBreak(80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text("REGISTRO FOTOGRÁFICO Y AUDITORÍA DE CAMPO (DS N° 209):", margin, currentY);
    currentY += 15;

    activePhotos.forEach(([fieldId, imgData]) => {
      const fieldTitle = fieldTitles[fieldId] || fieldId;
      const textVal = String(data[fieldId] || "Sin observaciones específicas registradas.");

      // Check page break for a photo-block
      checkPageBreak(130);

      // Draw Sub-indicator title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(`EV. FOTOGRÁFICA - ${fieldTitle.toUpperCase()}`, margin, currentY);
      currentY += 8;

      // Draw light container box
      const boxHeight = 90;
      doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 4, 4, 'F');
      doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, currentY, contentWidth, boxHeight, 4, 4, 'S');

      // Add Image
      try {
        doc.addImage(imgData, 'JPEG', margin + 8, currentY + 8, 120, 74);
      } catch (imgError) {
        try {
          doc.addImage(imgData, 'PNG', margin + 8, currentY + 8, 120, 74);
        } catch (pngError) {
          doc.setFillColor(230, 230, 230);
          doc.rect(margin + 8, currentY + 8, 120, 74, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(150, 150, 150);
          doc.text("Error rendering image", margin + 25, currentY + 42);
        }
      }

      // Draw observation text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

      const textX = margin + 135;
      const textW = contentWidth - 142;
      
      doc.text("OBSERVACIÓN REGISTRADA EN VISITA:", textX, currentY + 15);
      
      doc.setFont('helvetica', 'normal');
      drawJustifiedText(textVal, textX, currentY + 26, textW, 7, false);

      currentY += boxHeight + 15;
    });
  }

  // 4. INFORME DE BRECHAS Y PLAN DE ACCIÓN REGLAMENTARIO (FACTOR DE SEGURIDAD EXIGIBLE)
  doc.addPage();
  currentY = margin;
  addSectionHeader("4. CUADRO DE BRECHAS Y MEDIDAS REGLAMENTARIAS");

  const measures = generateDS209Measures(data);

  if (measures.length === 0) {
    checkPageBreak(50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text("Actualmente no se registran brechas ni carencias según lo verificado en la matriz de vulnerabilidad.", margin, currentY);
    currentY += 30;
  } else {
    for (let index = 0; index < measures.length; index++) {
      const m = measures[index];
      const measureColor = m.prioridad === 'ALTA' ? COLORS.danger : 
                           m.prioridad === 'MEDIA' ? COLORS.warning : COLORS.success;
      
      const neededH = 100;
      checkPageBreak(neededH);

      // Caja exterior
      doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
      doc.roundedRect(margin, currentY, contentWidth, 85, 4, 4, 'F');
      doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, currentY, contentWidth, 85, 4, 4, 'S');

      // Línea izquierda código de prioridad
      doc.setFillColor(measureColor[0], measureColor[1], measureColor[2]);
      doc.rect(margin, currentY, 4, 85, 'F');

      // Texto de prioridad y artículo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(measureColor[0], measureColor[1], measureColor[2]);
      doc.text(`CUMPLIMIENTO EXIGIBLE — PRIORIDAD ${m.prioridad}`, margin + 12, currentY + 16);

      doc.setFontSize(7.5);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(`${m.articulo.toUpperCase()} - DIMENSIÓN: ${m.dimension.toUpperCase()}`, margin + 12, currentY + 28);

      // Brecha
      doc.setFont('helvetica', 'bold');
      doc.text("BRECHA:", margin + 12, currentY + 44);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text(truncateString(m.brecha, 100), margin + 65, currentY + 44);

      // Medida Correctora
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text("MEDIDA CORR.:", margin + 12, currentY + 56);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text(truncateString(m.medida, 100), margin + 90, currentY + 56);

      // Metas sugeridas
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(`Plazo Sugerido: ${m.plazoSugerido}`, margin + 12, currentY + 71);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text(`Responsable: ${m.responsableSugerido}`, margin + 200, currentY + 71);
      doc.text(`Evidencia: ${truncateString(m.evidenciaCumplimiento, 50)}`, margin + 310, currentY + 71);

      currentY += 100;
    }
  }

  // 4.1 MATRIZ DE SEGUIMIENTO Y PLAN DE ACCIÓN CON TRAZABILIDAD
  const actionPlanItems = data.actionPlan || [];
  if (actionPlanItems.length > 0) {
    checkPageBreak(85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.text("PLAN DE ACCIÓN, TRAZABILIDAD Y EJECUCIÓN DE MEDIDAS DE MITIGACIÓN", margin, currentY);
    currentY += 16;

    for (let i = 0; i < actionPlanItems.length; i++) {
      const act = actionPlanItems[i];
      const statusColor = act.status === 'verificado' || act.status === 'completado' ? COLORS.success :
                          act.status === 'en_proceso' ? COLORS.secondary : COLORS.danger;

      const cardHeight = 72;
      checkPageBreak(cardHeight + 10);

      doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
      doc.roundedRect(margin, currentY, contentWidth, cardHeight, 4, 4, 'F');
      doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, currentY, contentWidth, cardHeight, 4, 4, 'S');

      // Barra indicadora de estado
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.rect(margin, currentY, 4, cardHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.text(truncateString(act.title, 75), margin + 12, currentY + 14);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(`ESTADO: ${act.status.toUpperCase()} (${act.progress}%)`, margin + contentWidth - 140, currentY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text(`ACCIÓN REQUERIDA: ${truncateString(act.actionRequired, 110)}`, margin + 12, currentY + 28);

      // Fila de Mitigador y Responsable
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(`EJECUTA/MITIGA: ${truncateString(act.executor || 'FACTOR PROTEGE', 40)}`, margin + 12, currentY + 42);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.text(`RESP. CLIENTE: ${truncateString(act.responsible, 30)}`, margin + 250, currentY + 42);

      // Fila de Plazo, Presupuesto y Comercial
      const outcomeLabel = act.commercialOutcome === 'ganada' ? 'GANADA' :
                           act.commercialOutcome === 'perdida' ? 'PERDIDA' :
                           act.commercialOutcome === 'cotizado' ? 'COTIZADO' : 'N/A';
      doc.text(`PLAZO: ${act.dueDate}`, margin + 12, currentY + 56);
      doc.text(`INVERSIÓN: $${(act.budgetEstimate || 0).toLocaleString('es-CL')} CLP`, margin + 150, currentY + 56);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(act.commercialOutcome === 'ganada' ? COLORS.success[0] : act.commercialOutcome === 'perdida' ? COLORS.danger[0] : COLORS.text[0],
                       act.commercialOutcome === 'ganada' ? COLORS.success[1] : act.commercialOutcome === 'perdida' ? COLORS.danger[1] : COLORS.text[1],
                       act.commercialOutcome === 'ganada' ? COLORS.success[2] : act.commercialOutcome === 'perdida' ? COLORS.danger[2] : COLORS.text[2]);
      doc.text(`VENTA: ${outcomeLabel} ($${(act.opportunityValue || act.budgetEstimate || 0).toLocaleString('es-CL')} CLP)`, margin + 300, currentY + 56);

      currentY += cardHeight + 10;
    }
    currentY += 10;
  }

  // 5. DICTAMEN TÉCNICO Y PROPUESTA OPERATIVA (IA CON MARGEN Y SANGRÍA PERFECCIONADA)
  doc.addPage();
  currentY = margin;
  addSectionHeader("5. DICTAMEN TÉCNICO PROFESIONAL DE LA DIRECCIÓN");

  const paragraphs = reportText.split('\n');
  let firstChapter = true;

  paragraphs.forEach((p) => {
    const cleanP = stripMarkdown(p);
    if (!cleanP) { currentY += 8; return; }

    const isTitle = isReportTitle(p, cleanP);
    const isMajor = isTitle && (/^[IVXLCDM]+\./i.test(cleanP));

    if (isMajor) {
      if (!firstChapter) {
        doc.addPage();
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.rect(0, 0, pageWidth, 5, 'F');
        currentY = margin;
      }
      firstChapter = false;

      checkPageBreak(65);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(cleanP.toUpperCase(), margin, currentY);
      currentY += 12;
      doc.setDrawColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
      doc.setLineWidth(0.75);
      doc.line(margin, currentY, margin + 65, currentY);
      currentY += 24;
    } else if (isTitle) {
      checkPageBreak(50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(cleanP, margin, currentY);
      currentY += 18;
    } else {
      const trimmedP = p.trim();
      const isBullet = trimmedP.startsWith('-') || trimmedP.startsWith('*') || trimmedP.startsWith('•');
      const alphabeticMatch = trimmedP.match(/^([a-fA-F0-9]+[\)\.])\s(.*)/);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

      if (isBullet) {
        const cleanContent = stripMarkdown(trimmedP.replace(/^[\-\*•]\s*/, ""));
        // Check dynamic page break for the bullet
        checkPageBreak(25);
        const bulletY = currentY; // align bullet vertically
        doc.setFillColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
        doc.rect(margin + 5, bulletY - 5.5, 3.5, 3.5, 'F');
        
        currentY = drawJustifiedText(cleanContent, margin + 15, currentY, contentWidth - 15, 8.5, false);
        currentY += 5;
      } else if (alphabeticMatch) {
        const marker = alphabeticMatch[1];
        const rest = stripMarkdown(alphabeticMatch[2]);
        
        checkPageBreak(25);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.text(marker, margin + 5, currentY);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
        currentY = drawJustifiedText(rest, margin + 22, currentY, contentWidth - 22, 8.5, false);
        currentY += 5;
      } else {
        // Paragraph normal
        currentY = drawJustifiedText(cleanP, margin, currentY, contentWidth, 8.5, true);
        currentY += 6;
      }
    }
  });

  // 6. DECLARACIÓN DE RESPONSABILIDAD Y VALIDACIÓN TÉCNICA
  checkPageBreak(195);
  currentY += 35;

  // Cuadro legal de Declaración Jurada
  checkPageBreak(120);
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(margin, currentY, contentWidth, 50, 4, 4, 'F');
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, contentWidth, 50, 4, 4, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.text("DECLARACIÓN DE RESPONSABILIDAD PROFESIONAL Y VALIDACIÓN TÉCNICA:", margin + 12, currentY + 16);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
  doc.text("El presente instrumento técnico-organizativo constituye la declaración jurada y formal del consultor de seguridad", margin + 12, currentY + 28);
  doc.text("acreditado ante la autoridad fiscalizadora, para los efectos previstos en la Ley N° 21.659 de Seguridad Privada de Chile.", margin + 12, currentY + 38);

  currentY += 65;

  // Renderizar firma digitalizada
  if (data.signature) {
    checkPageBreak(120);
    doc.addImage(data.signature, 'PNG', pageWidth / 2 - 95, currentY, 190, 65);
    currentY += 75;
    doc.setFontSize(7.5);
    doc.setTextColor(180);
    doc.text("___________________________________________", pageWidth / 2, currentY, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text("FIRMADO ELECTRÓNICAMENTE POR EL CONSULTOR EXPERTO", pageWidth / 2, currentY + 13, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(`${data.auditorName || "S/I"} | RUT: ${data.rut || "S/I"}`, pageWidth / 2, currentY + 24, { align: 'center' });
  } else {
    checkPageBreak(60);
    currentY += 25;
    doc.setFontSize(7.5);
    doc.setTextColor(180);
    doc.text("___________________________________________", pageWidth / 2, currentY, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.text("FIRMA CORPORATIVA (PENDIENTE DE DIGITALIZACIÓN)", pageWidth / 2, currentY + 13, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
    doc.text(`${data.auditorName || "CONSULTOR S/I"}`, pageWidth / 2, currentY + 24, { align: 'center' });
  }

  // Footer Paginación Institucional
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    
    // Dibujar línea fina en la cabecera
    if (i > 1) {
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(margin, margin - 15, pageWidth - margin, margin - 15);
      doc.text("ESTUDIO TÉCNICO DE SEGURIDAD PRIVADA DE CONFORMIDAD RE 1820 & DS 209", margin, margin - 22);
    }

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 45, pageWidth - margin, pageHeight - 45);
    
    doc.text(`FACTOR PROTEGE CHILE — REVISIÓN TÉCNICO LEGAL — DOCUMENTO SISTÉMICO CONFIDENCIAL`, margin, pageHeight - 34);
    doc.text(`PÁGINA ${i} DE ${pageCount}`, pageWidth - margin, pageHeight - 34, { align: 'right' });
  }

  return URL.createObjectURL(doc.output('blob'));
};

const truncateString = (str: string, num: number): string => {
  if (!str) return "";
  if (str.length <= num) return str;
  return str.slice(0, num) + "...";
};
