
import React, { useState, useRef } from 'react';
import { UserRole } from '../types';

interface Props {
  auditorName: string;
  rut: string;
  onSign: (signatureImage: string) => void;
  onClear: () => void;
  initialData?: string;
  userRole?: UserRole;
}

const DigitalSignature: React.FC<Props> = ({ auditorName, rut, onSign, onClear, initialData, userRole = 'consultant' }) => {
  const [isSigned, setIsSigned] = useState(!!initialData);
  const stampRef = useRef<HTMLDivElement>(null);
  const [signMetadata, setSignMetadata] = useState<{hash: string, date: string, id: string, authUser?: string} | null>(null);
  const [authRut, setAuthRut] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const generateSignature = async () => {
    // 1. Generate Fake Crypto Metadata
    const date = new Date();
    const hashPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const meta = {
      hash: `SHA256-${hashPart.toUpperCase()}-${Date.now().toString(16).toUpperCase()}`,
      date: date.toLocaleString('es-CL'),
      id: crypto.randomUUID().slice(0, 8).toUpperCase(),
      authUser: authRut || undefined
    };
    setSignMetadata(meta);
    setIsSigned(true);

    // 2. Wait for render and capture HTML to Image
    setTimeout(async () => {
      if (stampRef.current && window.html2canvas) {
        try {
          const canvas = await window.html2canvas(stampRef.current, {
            backgroundColor: null,
            scale: 2, // High res for PDF
            logging: false
          });
          const imgData = canvas.toDataURL('image/png');
          onSign(imgData);
        } catch (e) {
          console.error("Error generating signature image", e);
        }
      }
    }, 100);
  };

  const handleClaveUnicaAuth = () => {
    if(!authRut) return alert("Ingrese el RUT del entrevistado.");
    setIsAuthenticating(true);
    setTimeout(() => {
        setIsAuthenticating(false);
        generateSignature();
    }, 1500); // Simulate network check
  };

  const handleClear = () => {
    setIsSigned(false);
    setSignMetadata(null);
    setAuthRut('');
    onClear();
  };

  if (isSigned) {
    return (
      <div className="flex flex-col items-center animate-fade-in">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
          <p className="text-xs text-slate-400 mb-2 text-center uppercase tracking-widest">
             {userRole === 'authority' ? 'Comprobante de Visita Inspectiva (Oficial)' : 'Vista Previa Estampilla Digital'}
          </p>
          
          {/* THE STAMP ELEMENT TO CAPTURE */}
          <div 
            ref={stampRef} 
            className={`w-[300px] h-[120px] border-2 rounded bg-white relative flex flex-row overflow-hidden ${userRole === 'authority' ? 'border-red-800' : 'border-blue-900'}`}
          >
            {/* Left Side: QR Simulation */}
            <div className={`w-[80px] flex items-center justify-center border-r p-2 ${userRole === 'authority' ? 'bg-red-50 border-red-800' : 'bg-blue-50 border-blue-900'}`}>
              <div className={`w-full h-full border bg-white flex flex-wrap content-center justify-center gap-0.5 p-1 ${userRole === 'authority' ? 'border-red-200' : 'border-blue-200'}`}>
                 {/* Fake QR pattern */}
                 {Array.from({length: 36}).map((_, i) => (
                   <div key={i} className={`w-1.5 h-1.5 ${Math.random() > 0.4 ? (userRole === 'authority' ? 'bg-red-900' : 'bg-blue-900') : 'bg-transparent'}`}></div>
                 ))}
              </div>
            </div>

            {/* Right Side: Data */}
            <div className={`flex-1 p-2 flex flex-col justify-center text-[8px] font-sans leading-tight ${userRole === 'authority' ? 'text-red-900' : 'text-blue-900'}`}>
              <strong className={`text-[10px] uppercase block mb-1 border-b pb-0.5 ${userRole === 'authority' ? 'border-red-200' : 'border-blue-200'}`}>
                {userRole === 'authority' ? 'AUTENTICADO GOBIERNO DE CHILE' : 'FIRMADO DIGITALMENTE'}
              </strong>
              
              <div className="grid grid-cols-[40px_1fr] gap-x-1 gap-y-0.5">
                {userRole === 'authority' ? (
                    <>
                        <span className="font-bold text-slate-500">FISCALIZADOR:</span>
                        <span className="font-bold uppercase truncate">{auditorName || 'INSPECTOR'}</span>
                        
                        <span className="font-bold text-slate-500">ENTREVISTADO:</span>
                        <span className="font-bold uppercase">{signMetadata?.authUser || 'S/I'}</span>
                        
                        <span className="font-bold text-slate-500">MÉTODO:</span>
                        <span className="font-bold text-blue-600">CLAVE ÚNICA (SIMULADO)</span>
                    </>
                ) : (
                    <>
                        <span className="font-bold text-slate-500">POR:</span>
                        <span className="font-bold uppercase truncate">{auditorName || 'AUDITOR'}</span>
                        
                        <span className="font-bold text-slate-500">RUT:</span>
                        <span>{rut || 'S/I'}</span>
                    </>
                )}
                
                <span className="font-bold text-slate-500">FECHA:</span>
                <span>{signMetadata?.date || new Date().toLocaleString('es-CL')}</span>
                
                <span className="font-bold text-slate-500">FOLIO:</span>
                <span className="font-mono text-[7px] truncate">{signMetadata?.hash || 'PENDIENTE'}</span>
              </div>
              
              <div className={`mt-1 pt-1 border-t text-[6px] text-slate-400 text-center ${userRole === 'authority' ? 'border-red-100' : 'border-blue-100'}`}>
                {userRole === 'authority' ? 'Ministerio del Interior y Seguridad Pública - Ley 21.659' : 'Certificado de Validez Legal - Ley 19.799'}
              </div>
            </div>
          </div>

          {initialData && !signMetadata && <p className="text-xs text-center text-green-500 mt-2">✓ Firma cargada previamente</p>}
        </div>
        
        <button 
          onClick={handleClear}
          className="text-xs text-red-400 hover:text-red-300 underline"
        >
          {userRole === 'authority' ? 'Anular Validación' : 'Revocar Firma'}
        </button>
      </div>
    );
  }

  // --- AUTHORITY (CLAVE UNICA) MODE ---
  if (userRole === 'authority') {
      return (
        <div className="flex flex-col items-center w-full py-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="mb-4 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center mx-auto mb-2 text-white font-bold text-lg shadow-lg">
                    CÚ
                </div>
                <h3 className="text-slate-800 dark:text-white font-bold text-sm">Autenticación de Entrevistado</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Para cerrar el acta de fiscalización, el representante de la entidad debe autenticarse.
                </p>
            </div>

            <div className="w-full max-w-xs space-y-3">
                <input 
                    type="text" 
                    placeholder="RUT Entrevistado (Ej: 12.345.678-9)"
                    value={authRut}
                    onChange={(e) => setAuthRut(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm text-center font-mono focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 dark:text-white"
                />
                <button 
                    onClick={handleClaveUnicaAuth}
                    disabled={isAuthenticating || !authRut}
                    className="w-full px-6 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-400 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2 text-sm"
                >
                    {isAuthenticating ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Validando Clave Única...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Validar Identidad
                        </>
                    )}
                </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center px-4">
                * Simulación de integración con API Clave Única Gobierno Digital.
            </p>
        </div>
      );
  }

  // --- CONSULTANT (E-SIGN) MODE ---
  return (
    <div className="flex flex-col items-center w-full py-6 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
      <div className="mb-4 text-center">
        <svg className="w-12 h-12 text-blue-500 mx-auto mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h3 className="text-slate-200 font-bold">Firma Electrónica Avanzada</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Genere un certificado digital criptográfico para validar este documento según normativa.
        </p>
      </div>
      
      <button 
        onClick={generateSignature}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/30 transition transform hover:scale-105 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        Firmar Documento Digitalmente
      </button>
    </div>
  );
};

export default DigitalSignature;
