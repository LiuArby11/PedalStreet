import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function UpdatePassword({ darkMode }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  const [modal, setModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: ""
  });

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  const isDark = darkMode === true;
  const themeBgMain = isDark ? 'bg-[#050505]' : 'bg-[#f0f0f0]';
  const themeCard = isDark ? 'bg-[#0d0e12] border-white/5 shadow-2xl' : 'bg-white border-gray-200 shadow-xl';
  const themeInput = isDark ? 'bg-black border-white/5 text-white' : 'bg-gray-50 border-gray-200 text-black';
  const themeTextMain = isDark ? 'text-white' : 'text-gray-900';
  const themeTextSub = isDark ? 'text-gray-500' : 'text-gray-600';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD RECOVERY" || session) {
        setIsReady(true);
      } else {
        setTimeout(() => {
          if (!isReady) navigate('/login');
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isReady]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      showModal("error", "UPDATE FAILED", error.message);
    } else {
      showModal("success", "PASSWORD CHANGED", "Access updated. You will be redirected to login shortly.");
      
      setTimeout(async () => {
        await supabase.auth.signOut(); 
        navigate('/login');
      }, 3000);
    }
    setLoading(false);
  };

  if (!isReady) return (
    <div className={`min-h-screen ${themeBgMain} flex items-center justify-center text-orange-600 font-black animate-pulse uppercase tracking-[0.5em]`}>
      Authenticating Recovery Link...
    </div>
  );

  return (
    <div className={`min-h-screen ${themeBgMain} flex items-center justify-center ${themeTextMain} font-sans px-6 transition-colors duration-500`}>
      <div className={`w-full max-w-[400px] ${themeCard} p-10 rounded-[3rem] border relative overflow-hidden transition-all duration-500`}>
        
        <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-6 leading-none ${themeTextMain}`}>
          NEW <span className="text-orange-600">KEY.</span>
        </h2>
        
        <p className={`text-[9px] font-black ${themeTextSub} uppercase tracking-[0.4em] mb-8`}>
          Reset Security Credentials
        </p>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest ml-2">New Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className={`w-full ${themeInput} border p-5 rounded-2xl text-[11px] font-bold outline-none focus:border-orange-600 transition-all`}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-orange-600 p-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] text-white hover:bg-orange-700 transition-all transform active:scale-95 shadow-lg shadow-orange-600/20"
          >
            {loading ? "SAVING..." : "RESET PASSWORD"}
          </button>
        </form>

        <div className={`absolute bottom-0 right-0 p-4 opacity-10 pointer-events-none`}>
          <span className="text-[7px] font-mono tracking-widest">SEC_VER_V2</span>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200] px-6">
          <div className={`${isDark ? 'bg-[#0d0e12] border-white/10' : 'bg-white border-gray-200'} border rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300`}>
            
            <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-[2.5rem] ${
              modal.type === "error" ? "bg-red-600" : "bg-orange-600"
            }`} />

            <h3 className={`text-3xl font-black italic uppercase tracking-tight mb-4 ${themeTextMain} leading-tight`}>
              {modal.title}
            </h3>

            <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'} text-sm mb-8 font-medium`}>
              {modal.message}
            </p>

            <button
              onClick={() => {
                if (modal.type === "success") return;
                setModal({ ...modal, open: false });
              }}
              className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all ${
                modal.type === "success" 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                  : `${isDark ? 'bg-white text-black hover:bg-orange-600 hover:text-white' : 'bg-black text-white hover:bg-orange-600'}`
              }`}
            >
              {modal.type === "success" ? "REDIRECTING..." : "ACKNOWLEDGE"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}