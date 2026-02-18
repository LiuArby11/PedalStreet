import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Login({ darkMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [modal, setModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    redirectTo: null
  });

  const showModal = (type, title, message, redirectTo = null) => {
    setModal({ open: true, type, title, message, redirectTo });
  };

  const closeModal = () => {
    const redirectTo = modal.redirectTo;
    setModal({ ...modal, open: false, redirectTo: null });
    if (redirectTo) navigate(redirectTo);
  };

  const needsDeliveryProfile = async (userId) => {
    if (!userId) return false;

    const contact = await supabase
      .from('profiles')
      .select('address, phone')
      .eq('id', userId)
      .maybeSingle();

    if (!contact.error && contact.data) {
      const hasAddress = String(contact.data.address || '').trim().length > 0;
      const hasPhone = String(contact.data.phone || '').trim().length > 0;
      return !(hasAddress && hasPhone);
    }

    if (String(contact.error?.code || '') === '42703') {
      const fallback = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .maybeSingle();

      if (!fallback.error && fallback.data) {
        const hasPhone = String(fallback.data.phone || '').trim().length > 0;
        return !hasPhone;
      }
    }

    return false;
  };

  const lookupProfileByUsername = async (rawUsername) => {
    const normalizedUsername = String(rawUsername || '').trim();
    if (!normalizedUsername) return { userRecord: null, lookupError: null };

    let userRecord = null;
    let lookupError = null;

    const profileWithEmailCopy = await supabase
      .from('profiles')
      .select('email_copy')
      .ilike('username', normalizedUsername)
      .limit(1);

    if (!profileWithEmailCopy.error) {
      userRecord = profileWithEmailCopy.data?.[0] || null;
    } else if (String(profileWithEmailCopy.error.code || '') === '42703') {
      const profileWithEmail = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', normalizedUsername)
        .limit(1);
      userRecord = profileWithEmail.data?.[0] || null;
      lookupError = profileWithEmail.error;
    } else {
      lookupError = profileWithEmailCopy.error;
    }

    return { userRecord, lookupError };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { userRecord, lookupError: profileError } = await lookupProfileByUsername(username);

    if (profileError || !userRecord) {
      showModal("error", "ACCESS DENIED", "Username not found.");
      setLoading(false);
      return;
    }

    const loginEmail = userRecord.email_copy || userRecord.email;
    if (!loginEmail) {
      showModal(
        "error",
        "VERIFICATION FAILED",
        "Account email link is missing. Please contact admin to sync profiles."
      );
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
      email: loginEmail, 
      password 
    });

    if (authError) {
      showModal("error", "VERIFICATION FAILED", authError.message);
    } else {
      const userId = authData?.user?.id;
      const shouldPromptProfile = await needsDeliveryProfile(userId);
      if (shouldPromptProfile) {
        showModal(
          "info",
          "PROFILE SETUP RECOMMENDED",
          "Please add your delivery address and phone in Profile before checkout.",
          "/profile"
        );
      } else {
        navigate('/');
      }
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
    if (error) showModal("error", "GOOGLE AUTH ERROR", error.message);
  };

  const handleForgotPassword = async () => {
    if (!username) {
      showModal("error", "RECOVERY FAILED", "Enter your username first.");
      return;
    }

    const { userRecord, lookupError } = await lookupProfileByUsername(username);

    if (lookupError || !userRecord) {
      showModal("error", "RECOVERY FAILED", "Username not found.");
      return;
    }

    const recoveryEmail = userRecord.email_copy || userRecord.email;
    if (!recoveryEmail) {
      showModal("error", "RECOVERY FAILED", "No recovery email linked to this account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      recoveryEmail,
      { redirectTo: `${window.location.origin}/update-password` }
    );

    if (error) {
      showModal("error", "RECOVERY ERROR", error.message);
    } else {
      showModal("success", "RECOVERY SIGNAL SENT", "Check your inbox.");
    }
  };

  const themeBgMain = darkMode ? 'bg-[#050505]' : 'bg-[#f4f4f4]';
  const themeCard = darkMode ? 'bg-[#0d0e12] border-white/5 shadow-2xl' : 'bg-white border-gray-200 shadow-xl';
  const themeTextMain = darkMode ? 'text-white' : 'text-gray-900';
  const themeTextSub = darkMode ? 'text-zinc-500' : 'text-gray-600';
  const themeInput = darkMode ? 'bg-black border-white/5 text-white' : 'bg-gray-100 border-gray-300 text-black';
  const themeLabel = darkMode ? 'text-zinc-600' : 'text-gray-500';
  const themeSeparator = darkMode ? 'bg-white/5' : 'bg-black/10';
  const themeGoogleBtn = darkMode ? 'bg-black text-white border border-white/5 hover:bg-orange-600' : 'bg-gray-100 text-black border border-gray-200 hover:bg-black hover:text-white';
  const passwordToggleBtn = darkMode
    ? 'bg-white/5 text-zinc-300 hover:text-orange-500'
    : 'bg-white text-gray-600 hover:text-orange-600';

  return (
    <div className={`min-h-screen ${themeBgMain} flex items-center justify-center px-4 md:px-6 py-10 relative overflow-hidden transition-colors duration-500 font-sans`}>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-5%] w-[60%] md:w-[40%] h-[40%] ${darkMode ? 'bg-orange-600/10' : 'bg-orange-600/5'} blur-[100px] md:blur-[120px] rounded-full`} />
        <div className={`absolute bottom-[-10%] right-[-5%] w-[50%] md:w-[30%] h-[30%] ${darkMode ? 'bg-white/5' : 'bg-black/5'} blur-[80px] md:blur-[100px] rounded-full`} />
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8 md:mb-10">
          <div className={`inline-block px-3 py-1 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} border rounded-full mb-3 md:mb-4`}>
            <p className="text-[6px] md:text-[7px] font-black text-orange-600 uppercase tracking-[0.5em] animate-pulse">Login Access To PedalStreet</p>
          </div>
          <h2 className={`text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none ${themeTextMain}`}>
              LOG <span className="text-orange-600">IN.</span>
          </h2>
          <p className={`${themeTextSub} text-[8px] md:text-[10px] font-bold uppercase tracking-[0.3em] mt-3`}>Identity Verification Required</p>
        </div>

        <div className={`${themeCard} p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border transition-all duration-500 relative`}>
          
          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
            
            <div className="space-y-1.5">
              <label className={`text-[8px] font-black ${themeLabel} uppercase tracking-widest ml-4`}>Username</label>
              <input 
                className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-bold tracking-widest outline-none focus:border-orange-600 transition-all shadow-inner placeholder:text-zinc-800`} 
                placeholder="username" 
                value={username}
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between px-4">
                <label className={`text-[8px] font-black ${themeLabel} uppercase tracking-widest`}>Password</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword} 
                  className={`text-[8px] font-black uppercase hover:text-orange-600 transition-colors ${darkMode ? 'text-zinc-700' : 'text-gray-400'}`}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input 
                  className={`w-full ${themeInput} border p-3.5 md:p-4 pr-16 md:pr-20 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-bold tracking-widest outline-none focus:border-orange-600 transition-all shadow-inner placeholder:text-zinc-800`} 
                  placeholder="********" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-colors ${passwordToggleBtn}`}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-orange-600 text-white p-4 md:p-5 rounded-2xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.4em] mt-2 md:mt-4 hover:bg-black transition-all transform active:scale-[0.98] shadow-xl disabled:opacity-50"
            >
              {loading ? "VERIFYING..." : "LOGIN"}
            </button>
          </form>

          <div className="relative my-8 md:my-10 text-center">
            <div className={`absolute inset-y-1/2 w-full h-[1px] ${themeSeparator}`} />
            <span className={`relative ${darkMode ? 'bg-[#0d0e12]' : 'bg-white'} px-4 md:px-6 text-zinc-700 text-[8px] font-black uppercase tracking-[0.4em]`}>OR SIGN IN WITH</span>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            type="button"
            className={`w-full ${themeGoogleBtn} p-3.5 md:p-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg`}
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              className="w-4 h-4 transition-transform group-hover:scale-110" 
              alt="G" 
            />
            Google Sign in 
          </button>
        </div>

        <p className={`mt-8 md:mt-10 text-center ${themeTextSub} text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em]`}>
          Unregistered? <Link to="/signup" className={`${themeTextMain} hover:text-orange-600 ml-1 border-b ${darkMode ? 'border-white/5' : 'border-black/10'} hover:border-orange-600 transition-all`}>Create Profile</Link>
        </p>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-6">
          <div className={`${darkMode ? 'bg-[#0d0e12] border-white/10' : 'bg-white border-gray-200'} border rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300`}>
            <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-[2.5rem] ${
              modal.type === "error" ? "bg-red-600" : "bg-orange-600"
            }`} />
            <h3 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tight mb-4 ${themeTextMain}`}>
              {modal.title}
            </h3>
            <p className={`${darkMode ? 'text-zinc-400' : 'text-gray-600'} text-xs md:text-sm mb-8 font-medium`}>
              {modal.message}
            </p>
            <button
              onClick={closeModal}
              className="w-full bg-orange-600 text-white py-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] hover:bg-black transition-all"
            >
              CONFIRM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
