import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Kinukuha nito ang session mula sa URL hash fragment (#access_token=...)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsReady(true);
      } else {
        // Kung walang token, ibalik sa login pagkalipas ng 2 seconds
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
      alert("❌ UPDATE FAILED: " + error.message);
    } else {
      alert("✅ PASSWORD HARDENED: Access updated.");
      await supabase.auth.signOut(); 
      navigate('/login');
    }
    setLoading(false);
  };

  if (!isReady) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-orange-600 font-black animate-pulse uppercase tracking-[0.5em]">
      Authenticating Recovery Link...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-sans">
      <div className="w-full max-w-[400px] bg-[#0d0e12] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-6">NEW <span className="text-orange-600">KEY.</span></h2>
        <form onSubmit={handleUpdate} className="space-y-6">
          <input 
            type="password" 
            placeholder="ENTER NEW PASSWORD" 
            className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[11px] font-bold outline-none focus:border-orange-600 transition-all text-white"
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button disabled={loading} className="w-full bg-orange-600 p-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] hover:bg-white hover:text-black transition-all">
            {loading ? "SAVING..." : "RESET PASSWORD"}
          </button>
        </form>
      </div>
    </div>
  );
}