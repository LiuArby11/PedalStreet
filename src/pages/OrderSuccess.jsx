import { useNavigate } from 'react-router-dom';

export default function OrderSuccess({ darkMode }) {
  const navigate = useNavigate();
  const orderID = "PS-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  const isDark = darkMode === true;
  const themeBgMain = isDark ? 'bg-black' : 'bg-[#f8f9fa]';
  const themeCard = isDark ? 'bg-[#0d0e12] border-white/10' : 'bg-white border-gray-200 shadow-2xl';
  const themeTextMain = isDark ? 'text-white' : 'text-gray-900';
  const themeTextSub = isDark ? 'text-gray-500' : 'text-gray-600';
  const themeBadge = isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';

  return (
    <div className={`min-h-screen ${themeBgMain} flex items-center justify-center px-6 overflow-hidden relative font-sans transition-colors duration-500`}>
      
      <div className="absolute inset-0 z-0">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border ${isDark ? 'border-white/5' : 'border-black/5'} rounded-full animate-pulse`} />
      </div>

      <div className="relative z-10 max-w-xl w-full">
        <div className={`${themeCard} rounded-[3rem] p-12 text-center relative overflow-hidden transition-all duration-500`}>
          
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,88,12,0.4)] animate-in zoom-in duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className={`text-5xl md:text-6xl font-black italic uppercase tracking-tighter ${themeTextMain} mb-4`}>
            ORDER <span className="text-orange-600">SUCCESS.</span>
          </h1>

          <div className={`inline-block ${themeBadge} px-5 py-2 rounded-full mb-8`}>
            <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-gray-400' : 'text-gray-500'} italic`}>
              Tracking_ID: <span className="text-orange-600">{orderID}</span>
            </p>
          </div>

          <p className={`${themeTextSub} font-bold uppercase text-[9px] tracking-[0.2em] mb-10 leading-relaxed max-w-[280px] mx-auto`}>
            Your gear is now in the dispatch pipeline. <br/> Prepare for immediate deployment.
          </p>

          <button 
            onClick={() => navigate('/')}
            className={`w-full ${isDark ? 'bg-white text-black' : 'bg-black text-white'} py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 shadow-xl`}
          >
            RETURN TO SHOPPING
          </button>

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent opacity-40 animate-bounce" style={{animationDuration: '3s'}} />
          
          <div className="absolute bottom-4 right-8 opacity-20">
             <span className={`text-[7px] font-mono tracking-widest ${themeTextMain}`}>STREET_VERIFIED_2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}