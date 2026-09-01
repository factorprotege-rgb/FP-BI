
import React, { useState } from 'react';
import { UserRole } from '../types';
import { loginWithFirebase } from '../services/firebaseService';
import SentryGuardLogo from './SentryGuardLogo';

interface Props {
  onLogin: (username: string, role: UserRole) => void;
}

const PROFILES = [
  { id: 'gerente_comercial', label: 'Gerente Comercial', email: 'gerente@factorprotege.cl', color: '#1a73e8', desc: 'Visualización global de cartera, clientes por RUT, sucursales y conversión comercial' },
  { id: 'supervisor', label: 'Supervisor Zonal', email: 'supervisor@factorprotege.cl', color: '#1e8e3e', desc: 'Control técnico de sucursales, visación de auditorías y mitigación de brechas' },
  { id: 'ejecutivo_comercial', label: 'Ejecutivo Comercial', email: 'ejecutivo@factorprotege.cl', color: '#f59e0b', desc: 'Gestión directa de clientes, carga de evaluaciones por sucursal y cotizaciones' },
  { id: 'consultant', label: 'Evaluador Certificado', email: 'admin@factorprotege.cl', color: '#9333ea', desc: 'Evaluador técnico de campo y levantamiento DS 209' }
];

const Login: React.FC<Props> = ({ onLogin }) => {
  const [selectedProfileId, setSelectedProfileId] = useState(PROFILES[0].id);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const profile = PROFILES.find(p => p.id === selectedProfileId);
    if (!profile) return;

    try {
      await loginWithFirebase(profile.email, password);
      let role: UserRole = profile.id as UserRole;
      let displayName = profile.label.toUpperCase();
      onLogin(displayName, role);
    } catch (err: any) {
      setError('Contraseña incorrecta. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-[450px] bg-white border border-slate-200 rounded-lg shadow-google p-8 md:p-10 animate-slide-up flex flex-col">
        
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6 h-24 flex items-center justify-center">
            <SentryGuardLogo className="h-20 w-auto" />
          </div>
          <h1 className="text-2xl font-normal text-[#202124] text-center">Inicia sesión</h1>
          <p className="text-sm text-slate-600 mt-2">Continúa en FACTOR PROTEGE BI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="space-y-1 relative group">
            <label className="absolute -top-2.5 left-3 px-1.5 bg-white text-xs font-medium text-[#1a73e8] z-10">Perfil de acceso</label>
            <div className="relative">
              <select 
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full h-14 border border-[#dadce0] rounded-md px-4 outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white text-[#202124] text-base appearance-none cursor-pointer transition-all pr-10"
              >
                {PROFILES.map(p => (
                  <option key={p.id} value={p.id} className="text-slate-900">{p.label}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
          
          <div className="space-y-1 relative group">
            <label className="absolute -top-2.5 left-3 px-1.5 bg-white text-xs font-medium text-[#5f6368] group-focus-within:text-[#1a73e8] z-10 transition-colors">Ingresa tu contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 border border-[#dadce0] rounded-md px-4 outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] bg-white text-[#202124] text-base transition-all"
              required
            />
            <div className="flex justify-start pt-1">
               <button type="button" className="text-sm font-bold text-[#1a73e8] hover:bg-brand-50 px-1 py-0.5 rounded transition">¿Has olvidado tu contraseña?</button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-[#d93025] font-medium p-3 bg-red-50 rounded-md border border-red-100">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            <button 
              type="button"
              className="text-[#1a73e8] text-sm font-bold px-3 py-2 rounded-md hover:bg-brand-50 transition-all"
            >
              Crear cuenta
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="min-w-[100px] h-10 px-6 bg-[#1a73e8] hover:bg-[#1967d2] text-white font-bold rounded-md shadow-sm transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : 'Siguiente'}
            </button>
          </div>
        </form>
        
        <div className="mt-12 flex flex-wrap justify-between items-center text-xs text-[#5f6368] gap-4">
          <div className="flex gap-4">
             <span className="hover:text-[#202124] cursor-pointer transition-colors">Privacidad</span>
             <span className="hover:text-[#202124] cursor-pointer transition-colors">Condiciones</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded transition-colors">
             Español (Chile) <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-[11px] text-[#5f6368] font-medium tracking-wide flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-google-green"></span>
        FACTOR PROTEGE BI © 2026 • SEGURIDAD PRIVADA INTELIGENTE
      </div>
    </div>
  );
};

export default Login;
