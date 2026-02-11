import { useNavigate } from 'react-router-dom';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const orderID = "PS-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 overflow-hidden relative font-sans">
      
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full animate-pulse" />
      </div>

      <div className="relative z-10 max-w-xl w-full">
        <div className="bg-[#0d0e12] border border-white/10 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
          
          
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(234,88,12,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-4">
            ORDER <span className="text-orange-600">SUCCESS.</span>
          </h1>

          <div className="inline-block bg-white/5 border border-white/10 px-5 py-2 rounded-full mb-8">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
              Tracking_ID: <span className="text-orange-600">{orderID}</span>
            </p>
          </div>

          <p className="text-gray-500 font-bold uppercase text-[9px] tracking-[0.2em] mb-10 leading-relaxed">
            Your gear is now in the dispatch pipeline. <br/> Prepare for immediate deployment.
          </p>

          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 shadow-xl"
          >
            RETURN TO SHOPPING
          </button>

          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent opacity-40 animate-bounce" style={{animationDuration: '3s'}} />
        </div>
      </div>
    </div>
  );
}