
import React, { useState, useRef, useEffect } from 'react';
import { IndicatorDef } from '../types';
import { compressImage } from '../utils';
import { COMMON_FINDINGS } from '../constants';

interface Props {
  indicator: IndicatorDef;
  value: string | number | number[] | string[];
  onChange: (val: string | number | number[] | string[]) => void;
  observation: string;
  onObservationChange: (val: string) => void;
  evidence: string;
  onEvidenceChange: (val: string) => void;
  isActive?: boolean;
}

const IndicatorInput: React.FC<Props> = ({ 
  indicator, value, onChange, observation, onObservationChange, evidence, onEvidenceChange, isActive = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Voice Dictation Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-CL';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onObservationChange(observation ? `${observation} ${transcript}` : transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, [observation, onObservationChange]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const handleChipClick = (finding: string) => {
    onObservationChange(observation ? `${observation}. ${finding}` : finding);
  };

  const renderInputs = () => {
    if (indicator.type === 'select' || indicator.type === 'select-cash') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {indicator.options.map(opt => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => onChange(opt.value)}
                className={`p-6 rounded-3xl border-2 text-left transition-all duration-200 group ${
                  isSelected 
                    ? 'bg-brand-50 border-brand-500 dark:bg-brand-900/20 shadow-md' 
                    : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                   <span className={`text-base font-bold ${isSelected ? 'text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300'}`}>{opt.label}</span>
                   <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>Punto: {opt.value}</span>
                </div>
              </button>
            );
          })}
        </div>
      );
    }
    
    if (indicator.type.startsWith('aditivo')) {
      let currentLabels: string[] = [];
      if (Array.isArray(value)) {
        currentLabels = value.map(String);
      } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              currentLabels = parsed.map(String);
            }
          } catch (err) {
            currentLabels = [];
          }
        } else if (trimmed) {
          currentLabels = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (value) {
        currentLabels = [String(value)];
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {indicator.options.map(opt => {
            const isChecked = currentLabels.includes(opt.label);
            return (
              <button 
                key={opt.label}
                onClick={() => {
                  const next = isChecked ? currentLabels.filter(l => l !== opt.label) : [...currentLabels, opt.label];
                  onChange(next);
                }}
                className={`p-6 rounded-3xl border-2 text-left transition-all duration-200 ${
                  isChecked 
                    ? 'bg-brand-50 border-brand-500 dark:bg-brand-900/20 shadow-md' 
                    : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-base font-bold ${isChecked ? 'text-brand-700 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300'}`}>{opt.label}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isChecked ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                    {isChecked && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                  </div>
                </div>
                <p className="text-[10px] font-bold text-brand-600 dark:text-brand-500 mt-2 uppercase">+{opt.value} Puntos</p>
              </button>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Question Card */}
      <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-10 shadow-sm">
        <h3 className="text-2xl font-medium mb-2 text-slate-800 dark:text-white leading-tight">{indicator.title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed max-w-2xl">{indicator.description}</p>
        {renderInputs()}
      </div>

      {/* Observations and Evidence Section */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="text-xs font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Hallazgos Técnicos y Observaciones
          </label>
          <button 
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs transition-all ${
              isRecording 
                ? 'bg-google-red text-white animate-pulse shadow-lg' 
                : 'bg-white dark:bg-slate-800 text-google-blue border border-google-blue hover:bg-brand-50 dark:hover:bg-brand-900/20'
            }`}
          >
            {isRecording ? <span className="w-2 h-2 bg-white rounded-full"></span> : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>}
            {isRecording ? 'Escuchando...' : 'Dictar Hallazgo'}
          </button>
        </div>

        <textarea 
          value={observation} 
          onChange={e => onObservationChange(e.target.value)} 
          placeholder="Describa el estado actual, vulnerabilidades o medidas de mitigación observadas..." 
          className="w-full p-6 text-base bg-white dark:bg-[#303134] border border-slate-200 dark:border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/50 transition-all min-h-[140px] resize-none shadow-inner" 
        />

        {/* Informational Chips */}
        {COMMON_FINDINGS[indicator.id] && (
          <div className="flex flex-wrap gap-2 mt-4">
            {COMMON_FINDINGS[indicator.id].map((finding, idx) => (
              <button 
                key={idx}
                onClick={() => handleChipClick(finding)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-bold transition flex items-center gap-1 border border-slate-200 dark:border-slate-700"
              >
                <span className="text-brand-500">+</span> {finding}
              </button>
            ))}
          </div>
        )}
        
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6">
           <div className="flex-1 w-full">
              {evidence ? (
                <div className="relative w-full h-40 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                  <img src={evidence} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white text-slate-800 rounded-full hover:scale-110 transition"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                    <button onClick={() => onEvidenceChange('')} className="p-3 bg-google-red text-white rounded-full hover:scale-110 transition"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl text-sm font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  Capturar Evidencia Fotográfica
                </button>
              )}
              <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={async e => {
                if (e.target.files?.[0]) onEvidenceChange(await compressImage(e.target.files[0], 1200));
              }} />
           </div>
           <div className="w-full sm:w-1/3 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Guía del Evaluador</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">"{indicator.evaluatorGuide}"</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IndicatorInput;
