import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    
    const { data: userRecord } = await supabase
      .from('profiles')
      .select('email_copy')
      .eq('username', username)
      .single();
    
    if (!userRecord) {
      alert(" ACCESS DENIED: Username not found");
      setLoading(false);
      return;
    }

    
    const { error } = await supabase.auth.signInWithPassword({ 
      email: userRecord.email_copy, 
      password 
    });

    if (error) {
      alert(" VERIFICATION FAILED: " + error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin 
      }
    });
    if (error) alert(" GOOGLE_AUTH_ERROR: " + error.message);
  };

  const handleForgotPassword = async () => {
  const email = prompt("Enter your registered email for recovery:");
  if (email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      
      redirectTo: 'http://localhost:5173/update-password',
    });
    
    if (error) alert(" ERROR: " + error.message);
    else alert(" RECOVERY SIGNAL SENT: Check your inbox.");
  }
};

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 relative overflow-hidden text-white font-sans">
      
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-white/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
             <p className="text-[7px] font-black text-orange-600 uppercase tracking-[0.5em] animate-pulse">Login Access To PedalStreet</p>
          </div>
          <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
              LOG <span className="text-orange-600">IN.</span>
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Identity Verification Required</p>
        </div>

        <div className="bg-[#0d0e12] p-8 md:p-10 rounded-[3rem] border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative">
          
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-4">Username</label>
              <input 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600/20 transition-all shadow-inner placeholder:text-zinc-800 text-white" 
                placeholder="username" 
                value={username}
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between px-4">
                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Password</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword} 
                  className="text-[8px] font-black text-zinc-700 uppercase hover:text-orange-600 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600/20 transition-all shadow-inner placeholder:text-zinc-800 text-white" 
                placeholder="********" 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-orange-600 text-white p-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] mt-4 hover:bg-white hover:text-black transition-all transform active:scale-[0.98] shadow-xl shadow-orange-600/10 disabled:opacity-50"
            >
              {loading ? "VERIFYING..." : "LOGIN"}
            </button>
          </form>

          <div className="relative my-10 text-center">
            <div className="absolute inset-y-1/2 w-full h-[1px] bg-white/5" />
            <span className="relative bg-[#0d0e12] px-6 text-zinc-700 text-[8px] font-black uppercase tracking-[0.4em]">SIGN IN WITH</span>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            type="button"
            className="w-full bg-black text-white p-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              className="w-4 h-4" 
              alt="G" 
            />
            Login with Google 
          </button>
        </div>

        <p className="mt-10 text-center text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em]">
          Unregistered User? <Link to="/signup" className="text-white hover:text-orange-600 ml-1 border-b border-white/5 hover:border-orange-600 transition-all">Create Profile</Link>
        </p>

        <div className="absolute -bottom-10 left-0 right-0 flex justify-center opacity-10 pointer-events-none">
          <span className="text-[7px] font-mono tracking-widest text-white">PEDALSTREET_LOGIN</span>
        </div>
      </div>
    </div>
  );
}