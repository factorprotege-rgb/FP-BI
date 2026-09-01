
import { RiskData, CalculationResult, AIReportConfig, UserRole } from '../types';
import { calculateDS209Risk, generateDS209Measures, generateDS209Protocols } from '../utils';

export const generateTechnicalReport = async (
  data: RiskData, 
  result: CalculationResult,
  config: AIReportConfig,
  role: UserRole = 'consultant'
): Promise<string> => {
  
  // Calculate DS 209 data to pass along for highly enriched report context
  const ds209Result = calculateDS209Risk(data);
  const ds209Measures = generateDS209Measures(data);
  const ds209Protocols = generateDS209Protocols(data);

  try {
    const res = await fetch('/api/gemini-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data,
        result,
        config,
        role,
        ds209Result,
        ds209Measures,
        ds209Protocols
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Error del servidor (${res.status})`);
    }

    const json = await res.json();
    if (!json.report) {
      throw new Error("No se recibió el reporte del servidor.");
    }
    return json.report;

  } catch (error: any) {
    throw new Error("Fallo en la generación AI: " + error.message);
  }
};
