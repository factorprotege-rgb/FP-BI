import React, { useState, useRef, useEffect } from 'react';
import { RiskData } from '../types';
import { compressImage } from '../utils';

interface VulnerabilityFieldProps {
  label: string;
  fieldId: string;
  value: string;
  placeholder: string;
  data: RiskData;
  onChange: (key: string, value: any) => void;
}

function VulnerabilityField({ label, fieldId, value, placeholder, data, onChange }: VulnerabilityFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-CL';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const newValue = value ? `${value} ${transcript}` : transcript;
        onChange(fieldId, newValue);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [value, fieldId, onChange]);

  const toggleRecording = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const photos = data.vulnerabilityPhotos || {};
  const photoUrl = photos[fieldId];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const base64 = await compressImage(e.target.files[0], 1200);
      const nextPhotos = { ...photos, [fieldId]: base64 };
      onChange('vulnerabilityPhotos', nextPhotos);
    }
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextPhotos = { ...photos };
    delete nextPhotos[fieldId];
    onChange('vulnerabilityPhotos', nextPhotos);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/10 p-2 rounded-xl">
        <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
          {label}
        </label>
        <div className="flex gap-2">
          {/* Audio dictation button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all border ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse border-red-500 shadow-md'
                : 'bg-white dark:bg-[#303134] text-brand-600 dark:text-brand-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {isRecording ? (
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            ) : (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            )}
            {isRecording ? 'Escuchando...' : '🎤 Activar Voz'}
          </button>

          {/* Capture/Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all border bg-white dark:bg-[#303134] text-brand-600 dark:text-brand-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            📷 {photoUrl ? 'Cambiar Foto' : 'Tomar Foto'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        <div className="md:col-span-3">
          <textarea
            value={value}
            onChange={e => onChange(fieldId, e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 bg-slate-50 dark:bg-[#303134] border border-slate-200 dark:border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium min-h-[110px]"
          />
        </div>

        <div>
          {photoUrl ? (
            <div className="relative h-[110px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 group shadow-sm bg-slate-150">
              <img src={photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white text-slate-800 rounded-full hover:scale-105 transition text-xs"
                  title="Reemplazar foto"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="p-2 bg-red-600 text-white rounded-full hover:scale-105 transition text-xs"
                  title="Eliminar foto"
                >
                  🗑️
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-[110px] w-full border-2 border-dashed border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/10 cursor-pointer transition duration-150"
            >
              <span className="text-lg">📷</span>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Sin fotografía</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  data: RiskData;
  onChange: (key: string, value: any) => void;
}

type TabType = 'fisica' | 'tecnologia' | 'personal' | 'entorno' | 'protocolos';

export default function DS209Questionnaire({ data, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('fisica');

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'fisica', label: 'Seguridad Física', icon: '🧱' },
    { id: 'tecnologia', label: 'CCTV y Alarmas', icon: '📹' },
    { id: 'personal', label: 'Seguridad Humana', icon: '👥' },
    { id: 'entorno', label: 'Entorno Urbano', icon: '🌍' },
    { id: 'protocolos', label: 'Protocolos', icon: '📋' }
  ];

  const handleCheckboxGroup = (key: string, optionLabel: string, isChecked: boolean) => {
    const current = (data[key] as string || '').split(',').map(s => s.trim()).filter(Boolean);
    let next: string[];
    if (isChecked) {
      next = [...current, optionLabel];
    } else {
      next = current.filter(s => s !== optionLabel);
    }
    onChange(key, next.join(', '));
  };

  const isCheckedInGroup = (key: string, optionLabel: string) => {
    const current = (data[key] as string || '').split(',').map(s => s.trim()).filter(Boolean);
    return current.includes(optionLabel);
  };

  return (
    <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] shadow-sm overflow-hidden animate-slide-up">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 dark:border-[#3c4043] bg-slate-50/50 dark:bg-slate-800/10 p-2 overflow-x-auto gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-8 space-y-8">
        
        {/* PHYSICAL SECURITY TAB */}
        {activeTab === 'fisica' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">I. CONTROL DE ACCESOS Y CIERRES PERIMETRALES</h3>
              <p className="text-xs text-slate-400">Evaluación de barreras físicas y controles obligatorios según Art. 15 DS 209.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Tipo de Control de Acceso</label>
                <select
                  value={data.tipoControlAcceso || ''}
                  onChange={e => onChange('tipoControlAcceso', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                >
                  <option value="">Seleccione...</option>
                  <option value="Control biométrico / digital">Control biométrico / digital activo</option>
                  <option value="Control de tarjetas magnéticas">Lector de tarjetas magnéticas / RFID</option>
                  <option value="Control manual (guardia / planilla)">Control manual (Guardia / Planilla física)</option>
                  <option value="Sin control formal">Sin control formal / Pase directo</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Estado del Cierre Exterior</label>
                <select
                  value={data.estadoCierre || ''}
                  onChange={e => onChange('estadoCierre', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                >
                  <option value="">Seleccione...</option>
                  <option value="Excelente (muros continuos, herrajes de seguridad)">Excelente (muros continuos, herrajes de alta gama)</option>
                  <option value="Regular (cierres normales, portones vulnerables)">Regular (cierres normales, portones medianamente vulnerables)</option>
                  <option value="Deficiente (daños, brechas)">Deficiente (con grietas, aberturas o daños activos)</option>
                  <option value="Sin cierre perimetral">Sin cierre perimetral / Instalación abierta</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Altura de Rejas o Muros Perimetrales</label>
                <select
                  value={data.alturaRejas || ''}
                  onChange={e => onChange('alturaRejas', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                >
                  <option value="">Seleccione...</option>
                  <option value="Mayor a 2.5 metros con protección superior">Mayor a 2.5 metros con protección superior (Concertina/Cerco)</option>
                  <option value="Entre 1.8 y 2.5 metros">Entre 1.8 y 2.5 metros</option>
                  <option value="Menor a 1.8 metros">Menor de 1.8 metros</option>
                  <option value="Sin muros consistentes">No aplica / Sin muros consistentes</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Nivel de Iluminación Perimetral General</label>
                <select
                  value={data.nivelIluminacion || ''}
                  onChange={e => onChange('nivelIluminacion', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                >
                  <option value="">Seleccione...</option>
                  <option value="Suficiente (focos LED en todo el perímetro)">Suficiente (proyectores LED en todo el perímetro activo)</option>
                  <option value="Parcial (zonas oscuras en callejones o patios)">Parcial (zonas de sombra en patios traseros o laterales)</option>
                  <option value="Deficiente (zonas oscuras)">Deficiente (focos en mal estado / callejones oscuros)</option>
                  <option value="Sin iluminación">Sin iluminación exterior / Apagado nocturno</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Cantidad de Puntos Ciegos Identificados</label>
                <input
                  type="number"
                  min="0"
                  value={data.cantidadPuntosCiegos || 0}
                  onChange={e => onChange('cantidadPuntosCiegos', parseInt(e.target.value) || 0)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                  placeholder="Número de sectores sin visibilidad"
                />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-[#3c4043]">
              <VulnerabilityField
                label="Descripción Detallada de Controles y Accesos"
                fieldId="controlAccesos"
                value={data.controlAccesos || ''}
                placeholder="Explicite cómo se controla el flujo de clientes, visitas y camiones de carga de proveedores..."
                data={data}
                onChange={onChange}
              />

              <VulnerabilityField
                label="Diagnóstico del Cierre Perimetral y Concertinas"
                fieldId="cierrePerimetral"
                value={data.cierrePerimetral || ''}
                placeholder="Señale materiales, estado estructural, óxidos, presencia de cercos eléctricos, etc..."
                data={data}
                onChange={onChange}
              />

              <VulnerabilityField
                label="Ubicación de Puntos Ciegos Detectados"
                fieldId="puntosCiegos"
                value={data.puntosCiegos || ''}
                placeholder="Indique las coordenadas o sectores físicos de la instalación cubiertas por sombras o vegetación abultada..."
                data={data}
                onChange={onChange}
              />
            </div>
          </div>
        )}

        {/* CCTV & ALARMS TAB */}
        {activeTab === 'tecnologia' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">II. SISTEMAS TECNOLÓGICOS DE SEGURIDAD</h3>
              <p className="text-xs text-slate-400">Capacidades de monitoreo audiovisual disuasorio y detección de intentos de intrusión (Art. 16 y 17 DS 209).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">¿Cuenta con Sistema CCTV Activo?</label>
                <div className="flex gap-4">
                  {['SI', 'NO'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => onChange('cctv', opt)}
                      className={`flex-1 py-4 border-2 rounded-2xl font-bold text-sm transition-all ${
                        data.cctv === opt
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/10'
                          : 'bg-slate-50 border-transparent dark:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {data.cctv === 'SI' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Cantidad de Cámaras Instaladas</label>
                    <input
                      type="number"
                      min="0"
                      value={data.cantidadCamaras || 0}
                      onChange={e => onChange('cantidadCamaras', parseInt(e.target.value) || 0)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Resolución Promedio de Cámaras</label>
                    <select
                      value={data.resolucionCamaras || ''}
                      onChange={e => onChange('resolucionCamaras', e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                    >
                      <option value="">Seleccione...</option>
                      <option value="Alta (4K / 8MP o superior)">Alta (4K / 8MP o superior)</option>
                      <option value="Completa (1080p / 2MP a 5MP)">Completa o Media (1080p / 2MP a 5MP)</option>
                      <option value="Baja (Cámaras analógicas antiguas D1 / CIF)">Baja (Cámaras analógicas antiguas - menos de 2MP)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Días de Grabación Almacenados (Historial NVR/DVR)</label>
                    <input
                      type="number"
                      min="0"
                      value={data.grabacionDias || 0}
                      onChange={e => onChange('grabacionDias', parseInt(e.target.value) || 0)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                      placeholder="Mínimo exigido: 30 días"
                    />
                  </div>
                </>
              )}
            </div>

            {data.cctv === 'SI' && (
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-[#3c4043]">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-3">Cobertura de Zona con CCTV Activo (Marque todas las aplicables)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['Acceso principal', 'Perímetro exterior', 'Bóveda / Caja fuerte', 'Sala de ventas', 'Estacionamiento', 'Patio de carga', 'Bodega', 'Oficinas administración'].map(chk => {
                    const active = isCheckedInGroup('coberturaCCTV', chk);
                    return (
                      <button
                        key={chk}
                        onClick={() => handleCheckboxGroup('coberturaCCTV', chk, !active)}
                        className={`p-4 border-2 rounded-2xl text-left text-xs font-bold transition-all flex items-center justify-between ${
                          active
                            ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/10'
                            : 'bg-white border-slate-100 dark:bg-slate-800'
                        }`}
                      >
                        {chk}
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300'}`}>
                          {active && '✓'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-[#3c4043]">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">¿Posee Sistema de Alarma Técnico contra Intrusión?</label>
                <div className="flex gap-4">
                  {['SI', 'NO'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => onChange('alarma', opt)}
                      className={`flex-1 py-4 border-2 rounded-2xl font-bold text-sm transition-all ${
                        data.alarma === opt
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/10'
                          : 'bg-slate-50 border-transparent dark:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {data.alarma === 'SI' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">¿Cuenta con Monitoreo de Alarma Profesional (C.R.A)?</label>
                    <div className="flex gap-4">
                      {['SI', 'NO'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => onChange('monitoreo', opt)}
                          className={`flex-1 py-4 border-2 rounded-2xl font-bold text-sm transition-all ${
                            data.monitoreo === opt
                              ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/10'
                              : 'bg-slate-50 border-transparent dark:bg-slate-800 hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Empresa de Monitoreo Remoto contratada</label>
                    <input
                      type="text"
                      value={data.empresaMonitoreo || ''}
                      onChange={e => onChange('empresaMonitoreo', e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                      placeholder="Ej: Prosegur, ADT, Verisure, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Tiempo de Respuesta promedio reportado (minutos)</label>
                    <input
                      type="text"
                      value={data.tiempoRespuesta || ''}
                      onChange={e => onChange('tiempoRespuesta', e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                      placeholder="Ej: 10-15 min o Inmediato"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-[#3c4043]">
              <VulnerabilityField
                label="Sistemas adicionales de Prevención de Delitos"
                fieldId="sistemasPrevAlarma"
                value={data.sistemasPrevAlarma || ''}
                placeholder="Describa cañones de niebla, barreras de humo activo, sensores sísmicos de bóveda, etc..."
                data={data}
                onChange={onChange}
              />
            </div>
          </div>
        )}

        {/* SECURITY STAFFING TAB */}
        {activeTab === 'personal' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">III. GESTIÓN DE PERSONAL Y SEGURIDAD HUMANA OPERATIVA</h3>
              <p className="text-xs text-slate-400">Dotaciones autorizadas, guardias y capacitación fáctica acreditada OS10.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Cantidad Total de Guardias (Dotación en Sitio)</label>
                <input
                  type="number"
                  min="0"
                  value={data.guardias || 0}
                  onChange={e => onChange('guardias', parseInt(e.target.value) || 0)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                />
              </div>

              {Number(data.guardias || 0) > 0 && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">¿Todos los Guardias cuentan con Credencial OS10 Vigente?</label>
                    <div className="flex gap-4">
                      {['SI', 'NO'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => onChange('guardiasOS10', opt)}
                          className={`flex-1 py-4 border-2 rounded-2xl font-bold text-sm transition-all ${
                            data.guardiasOS10 === opt
                              ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/10'
                              : 'bg-slate-50 border-transparent dark:bg-slate-800 hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Modalidad de Turnos del Personal</label>
                    <select
                      value={data.turnosGuardias || ''}
                      onChange={e => onChange('turnosGuardias', e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                    >
                      <option value="">Seleccione...</option>
                      <option value="24/7 rotativo (H24)">Coordinación 24/7 rotativa continua (H24)</option>
                      <option value="Solo turno diurno comercial">Solo turno diurno de horario comercial</option>
                      <option value="Solo turno nocturno">Solo turno nocturno o de fines de semana</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Empresa externa proveedora de Guardias</label>
                    <input
                      type="text"
                      value={data.empresaGuardias || ''}
                      onChange={e => onChange('empresaGuardias', e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                      placeholder="Nombre de la empresa externa autorizada"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">¿Cuenta con Encargado de Seguridad Designado formal?</label>
                <div className="flex gap-4">
                  {['SI', 'NO'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => onChange('encargadoSeguridad', opt)}
                      className={`flex-1 py-4 border-2 rounded-2xl font-bold text-sm transition-all ${
                        data.encargadoSeguridad === opt
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/10'
                          : 'bg-slate-50 border-transparent dark:bg-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {data.encargadoSeguridad === 'SI' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Nombre del Encargado de Seguridad</label>
                  <input
                    type="text"
                    value={data.nombreEncargado || ''}
                    onChange={e => onChange('nombreEncargado', e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                    placeholder="Nombre completo"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-[#3c4043]">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-3">Medios de Comunicación Internos Existentes (Marque todos los aplicables)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Radios portátiles', 'Celulares corporativos', 'WhatsApp / Slack', 'Botones de pánico fijos', 'Central directa Carabineros', 'Megáfonos / Altavoces'].map(chk => {
                  const active = isCheckedInGroup('comunicaciones', chk);
                  return (
                    <button
                      key={chk}
                      onClick={() => handleCheckboxGroup('comunicaciones', chk, !active)}
                      className={`p-4 border-2 rounded-2xl text-left text-xs font-bold transition-all flex items-center justify-between ${
                        active
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/10'
                          : 'bg-white border-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {chk}
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300'}`}>
                        {active && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ENVIRONMENT TAB */}
        {activeTab === 'entorno' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">IV. ENTORNO Y COMUNIDAD LOCAL</h3>
              <p className="text-xs text-slate-400">Análisis delictual y geografía urbana inmediata como factores externos de riesgo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Clasificación Geográfica del Sector</label>
                <select
                  value={data.clasificacionEntorno || ''}
                  onChange={e => onChange('clasificacionEntorno', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                >
                  <option value="">Seleccione...</option>
                  <option value="Zona industrial masiva">Industrial o logística consolidada</option>
                  <option value="Calle comercial / Centro cívico">Calle comercial o céntrica densa</option>
                  <option value="Sector predominantemente residencial">Barrio residencial o suburbano</option>
                  <option value="Zona rural / Aislado">Zona semi-rural o periférica asilada</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Nivel Delictual Estimado del Sector</label>
                <select
                  value={data.nivelDelictual || ''}
                  onChange={e => onChange('nivelDelictual', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                >
                  <option value="">Seleccione...</option>
                  <option value="Muy alto (Incidentes semanales con armas)">Muy alto (Incidentes con armas o asaltos de forma regular)</option>
                  <option value="Alto (Incidentes mensuales de robo)">Alto (Incidentes periódicos de intrusión de delincuencia común)</option>
                  <option value="Medio">Moderado o Medio (Hurtos menores sin violencia extrema)</option>
                  <option value="Bajo">Mínimo o Bajo (Sectores tranquilos resguardados)</option>
                </select>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-[#3c4043]">
              <VulnerabilityField
                label="Descripción de Factores del Entorno de Riesgo"
                fieldId="entorno"
                value={data.entorno || ''}
                placeholder="Vecindades, colindancias con autopistas, sitios abandonados, campamentos, falta de alumbrado público municipal..."
                data={data}
                onChange={onChange}
              />

              <VulnerabilityField
                label="Descripción de las Rutas de Escape Urbanas del Sector"
                fieldId="rutasEscape"
                value={data.rutasEscape || ''}
                placeholder="Facilidad para que antisociales huyan con rapidez (ej: proximidad directa a autopistas principales, retornos rápidos, calles de un sentido, etc.)."
                data={data}
                onChange={onChange}
              />

              <VulnerabilityField
                label="Análisis cualitativo de Delitos Frecuentes"
                fieldId="delitosFrecuentes"
                value={data.delitosFrecuentes || ''}
                placeholder="Detalle si se han registrado asaltos con violencia, bandas organizadas, hurtos hormiga, portonazos recurrentes o alunizajes contra cortinas..."
                data={data}
                onChange={onChange}
              />
            </div>
          </div>
        )}

        {/* PROTOCOLS TAB */}
        {activeTab === 'protocolos' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">V. PROTOCOLOS OPERATIVOS DE COHERENCIA TÁCTICA</h3>
              <p className="text-xs text-slate-400">Estandarización de manuales de procedimientos exigibles según reglamentación (Art. 9 DS 209).</p>
            </div>

            <div className="space-y-6">
              {[
                { id: 'protocoloApertura', label: 'Protocolo formalizado para Apertura y Cierre de la instalación' },
                { id: 'protocoloRobo', label: 'Protocolo de acción inmediata ante Robos o Asaltos con violencia' },
                { id: 'protocoloAlarma', label: 'Protocolo de resguardos y claves secretas ante Activación de Alarmas' },
                { id: 'protocoloVisitas', label: 'Protocolo para recepción y registro biométrico de Control de Visitas o Proveedores' },
                { id: 'protocoloValores', label: 'Protocolo riguroso para Manejo, Custodia y Retiro de Efectivo / Valores' }
              ].map(item => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800 rounded-2xl gap-4">
                  <div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">Exigido por Decreto N°209</p>
                  </div>
                  <div className="flex gap-2 w-full md:w-48">
                    {['SI', 'NO'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => onChange(item.id, opt)}
                        className={`flex-1 py-2.5 border rounded-xl font-black text-xs transition-all ${
                          data[item.id] === opt
                            ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-[#3c4043]">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Fecha de la última capacitación técnica del Personal</label>
                <input
                  type="date"
                  value={data.capacitacionUltimaFecha || ''}
                  onChange={e => onChange('capacitacionUltimaFecha', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Enlace de Evidencias Digitales (Drive / Carpeta NVR)</label>
                <input
                  type="url"
                  value={data.evidenciaUrl || ''}
                  onChange={e => onChange('evidenciaUrl', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-[#303134] border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 text-sm font-medium"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-[#3c4043]">
              <VulnerabilityField
                label="Observaciones Finales detectadas en Levantamiento de Campo"
                fieldId="observaciones"
                value={data.observaciones || ''}
                placeholder="Señale cualquier elemento operativo complementario que no estuviera detallado en las preguntas anteriores..."
                data={data}
                onChange={onChange}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
