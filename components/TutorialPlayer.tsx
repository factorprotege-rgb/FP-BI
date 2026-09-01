
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onClose: () => void;
}

const SLIDES = [
  {
    id: 1,
    title: "Bienvenido a FACTOR PROTEGE BI",
    subtitle: "Plataforma de Evaluación de Riesgos (Ley 21.659)",
    desc: "Esta herramienta permite a consultores y fiscalizadores determinar el nivel de riesgo de una entidad obligada utilizando la Matriz Oficial de la Resolución Exenta 1820.",
    icon: (
      <svg className="w-24 h-24 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  },
  {
    id: 2,
    title: "Paso 1: Identificación y Entorno",
    subtitle: "Geolocalización e Inteligencia Policial",
    desc: "El sistema detecta automáticamente la ubicación. Al ingresar la Comuna, se cargan los índices de Vulnerabilidad (SPD) y Cobertura Policial, datos críticos para el cálculo.",
    icon: (
      <svg className="w-24 h-24 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    id: 3,
    title: "Paso 2: Matriz de 12 Factores",
    subtitle: "Evaluación Técnica en Terreno",
    desc: "Complete los 12 indicadores normativos (Rubro, Efectivo, Aforo, etc.). Use el botón de 'Micrófono' para dictar sus hallazgos y adjunte evidencia fotográfica en cada punto.",
    icon: (
      <svg className="w-24 h-24 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  {
    id: 4,
    title: "Paso 3: Análisis con IA",
    subtitle: "Motor Gemini 3 Pro (Legal)",
    desc: "Nuestra IA redacta el Informe Técnico analizando sus inputs contra la Ley 21.659. Puede personalizar el enfoque (Legal, Financiero, Operativo) antes de generar.",
    icon: (
      <svg className="w-24 h-24 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    )
  },
  {
    id: 5,
    title: "Paso 4: Exportación y Firma",
    subtitle: "PDF Corporativo Oficial",
    desc: "Finalmente, firme digitalmente el documento y descargue un PDF profesional con gráficos, anexos fotográficos y el dictamen de clasificación de riesgo (Bajo/Medio/Alto).",
    icon: (
      <svg className="w-24 h-24 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }
];

const DURATION_PER_SLIDE = 6000; // 6 seconds per slide

const TutorialPlayer: React.FC<Props> = ({ onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const totalDuration = SLIDES.length * DURATION_PER_SLIDE;

  const animate = (time: number) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = time - startTimeRef.current;
    
    // Calculate global progress (0 to 100)
    const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
    setProgress(newProgress);

    // Calculate current slide index based on time
    const newIndex = Math.min(Math.floor(elapsed / DURATION_PER_SLIDE), SLIDES.length - 1);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }

    if (elapsed < totalDuration && isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else if (elapsed >= totalDuration) {
      // Loop or Stop? Let's stop.
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      // Reset start time relative to current progress if we paused/resumed
      // Usually complex, simpler to just rely on re-render for simple slide show
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying]);

  const handleRestart = () => {
    startTimeRef.current = 0;
    setProgress(0);
    setCurrentIndex(0);
    setIsPlaying(true);
    requestRef.current = requestAnimationFrame(animate);
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#0f172a] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px] md:h-[400px]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-slate-400 hover:text-white bg-black/20 hover:bg-black/50 p-2 rounded-full transition"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Left: Visual */}
        <div className="w-full md:w-1/3 bg-slate-900 flex items-center justify-center relative overflow-hidden p-8">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50 z-10"></div>
           {/* Animated Icon */}
           <div key={currentSlide.id} className="animate-zoom-in relative z-10 transform transition-all duration-700">
             {currentSlide.icon}
           </div>
           
           {/* Slide Number */}
           <div className="absolute bottom-4 left-4 text-6xl font-bold text-slate-800 select-none z-0">
             0{currentSlide.id}
           </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center relative">
           <div className="space-y-4 animate-fade-in" key={currentSlide.id}>
             <span className="inline-block px-3 py-1 rounded bg-slate-800 text-brand-400 text-xs font-bold uppercase tracking-widest border border-slate-700">
               Tutorial Interactivo
             </span>
             <h2 className="text-3xl font-bold text-white">{currentSlide.title}</h2>
             <h3 className="text-xl text-slate-300 font-medium">{currentSlide.subtitle}</h3>
             <p className="text-slate-400 leading-relaxed text-sm md:text-base border-l-2 border-slate-700 pl-4">
               {currentSlide.desc}
             </p>
           </div>

           {/* Controls */}
           <div className="mt-auto pt-8 flex items-center justify-between">
             <div className="flex items-center gap-4">
               <button 
                 onClick={() => setIsPlaying(!isPlaying)}
                 className="w-10 h-10 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-slate-200 transition"
               >
                 {isPlaying ? (
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                 ) : (
                   <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                 )}
               </button>
               <button onClick={handleRestart} className="text-xs text-slate-500 hover:text-white transition uppercase font-bold tracking-wider">
                 Reiniciar
               </button>
             </div>
             
             <div className="text-xs font-mono text-slate-500">
               {currentIndex + 1} / {SLIDES.length}
             </div>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
          <div 
            className="h-full bg-brand-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

      </div>
    </div>
  );
};

export default TutorialPlayer;
