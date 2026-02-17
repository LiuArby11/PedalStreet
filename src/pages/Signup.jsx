import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup({ darkMode }) {
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', username: '', phone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    open: false, type: "info", title: "", message: "", redirectTo: null
  });

  const showModal = (type, title, message, redirectTo = null) => {
    setModal({ open: true, type, title, message, redirectTo });
  };

  const closeModal = () => {
    const redirectTo = modal.redirectTo;
    setModal({ ...modal, open: false, redirectTo: null });
    if (redirectTo) navigate(redirectTo);
  };

  const navigate = useNavigate();

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) showModal("error", "GOOGLE AUTH ERROR", error.message);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword)
      return showModal("error", "PASSWORD MISMATCH", "Passwords do not match.");

    setLoading(true);
    const normalizedEmail = String(formData.email || '').trim().toLowerCase();
    const normalizedUsername = String(formData.username || '').trim().toLowerCase();
    
    const { error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: formData.password,
      options: {
        data: {
          firstName: String(formData.firstName || '').trim(),
          lastName: String(formData.lastName || '').trim(),
          username: normalizedUsername,
          phone: String(formData.phone || '').trim()
        }
      }
    });

    if (authError) {
      showModal("error", "REGISTRATION FAILED", authError.message);
      setLoading(false);
    } 
    else {
      showModal("success", "ACCOUNT CREATED", "Please check your email, verify your account, then login.", "/login");
      setLoading(false);
    }
  };

  const isDark = darkMode === true;
  const themeBgMain = isDark ? 'bg-[#050505]' : 'bg-[#f4f4f7]';
  const themeCard = isDark ? 'bg-[#0d0e12] border-white/5' : 'bg-white border-gray-200 shadow-xl';
  const themeTextMain = isDark ? 'text-white' : 'text-gray-900';
  const themeTextSub = isDark ? 'text-zinc-500' : 'text-gray-600';
  const themeInput = isDark ? 'bg-black border-white/5 text-white' : 'bg-gray-100 border-gray-300 text-black';
  const themeLabel = isDark ? 'text-zinc-600' : 'text-gray-500';
  const themeGoogleBtn = isDark ? 'bg-white text-black hover:bg-orange-600 hover:text-white' : 'bg-gray-200 text-black hover:bg-black hover:text-white';
  const themeSeparator = isDark ? 'bg-white/5' : 'bg-black/10';
  const passwordToggleBtn = isDark
    ? 'bg-white/5 text-zinc-300 hover:text-orange-500'
    : 'bg-white text-gray-600 hover:text-orange-600';

  return (
    <div className={`min-h-screen ${themeBgMain} flex items-center justify-center px-4 md:px-6 py-10 md:py-12 relative overflow-hidden transition-colors duration-500 font-sans`}>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] right-[-5%] w-[60%] md:w-[45%] h-[45%] ${isDark ? 'bg-orange-600/10' : 'bg-orange-600/5'} blur-[100px] md:blur-[120px] rounded-full`} />
        <div className={`absolute bottom-[-10%] left-[-5%] w-[50%] md:w-[35%] h-[35%] ${isDark ? 'bg-white/5' : 'bg-black/5'} blur-[80px] md:blur-[100px] rounded-full`} />
      </div>

      <div className="w-full max-w-[520px] relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="text-center mb-8 md:mb-10">
          <div className={`inline-block px-3 py-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} border rounded-full mb-4 md:mb-5`}>
             <p className="text-[6px] md:text-[7px] font-black text-orange-600 uppercase tracking-[0.6em] animate-pulse"> CREATE ACCOUNT</p>
          </div>
          <h2 className={`text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none ${themeTextMain}`}>
            SIGN <span className="text-orange-600 font-black">UP NOW.</span>
          </h2>
          <p className={`${themeTextSub} text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] mt-3 md:mt-4`}>Identity Profile Setup</p>
        </div>

        <div className={`${themeCard} p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border relative overflow-hidden transition-all duration-500`}>
          
          <form onSubmit={handleSignup} className="grid grid-cols-2 gap-x-3 md:gap-x-4 gap-y-4 md:gap-y-6">
            
            <div className="col-span-1 space-y-1.5">
              <label className={`text-[8px] font-black ${themeLabel} uppercase tracking-[0.2em] ml-3 md:ml-4`}>First Name</label>
              <input 
                className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[10px] font-bold tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800`} 
                placeholder="first name" 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                required 
              />
            </div>

            <div className="col-span-1 space-y-1.5">
              <label className={`text-[8px] font-black ${themeLabel} uppercase tracking-[0.2em] ml-3 md:ml-4`}>Last Name</label>
              <input 
                className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[10px] font-bold tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800`} 
                placeholder="last name" 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                required 
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className={`text-[8px] font-black ${themeLabel} uppercase tracking-[0.2em] ml-3 md:ml-4`}>Username</label>
              <input 
                className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[10px] font-bold tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800`} 
                placeholder="username" 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                required 
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className={`text-[8px] font-black ${themeLabel} uppercase tracking-[0.2em] ml-3 md:ml-4`}> Email Address</label>
              <input 
                className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[10px] font-bold tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800`} 
                placeholder="EMAIL@GMAIL.COM" 
                type="email" 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className={`text-[8px] font-black ${themeLabel} uppercase tracking-[0.2em] ml-3 md:ml-4`}>Contact number</label>
              <input 
                className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[10px] font-bold tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800`} 
                placeholder="09XXXXXXXXX" 
                type="tel" 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                required 
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className={`text-[8px] font-black ${themeLabel} uppercase tracking-[0.2em] ml-3 md:ml-4`}>Password</label>
              <div className="relative">
                <input 
                  className={`w-full ${themeInput} border p-3.5 md:p-4 pr-16 md:pr-20 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-bold tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800`} 
                  placeholder="********" 
                  type={showPassword ? "text" : "password"} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
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

            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <label className={`text-[8px] font-black ${themeLabel} uppercase tracking-[0.2em] ml-3 md:ml-4`}>Confirm</label>
              <div className="relative">
                <input 
                  className={`w-full ${themeInput} border p-3.5 md:p-4 pr-16 md:pr-20 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-bold tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800`} 
                  placeholder="********" 
                  type={showConfirmPassword ? "text" : "password"} 
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-colors ${passwordToggleBtn}`}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="col-span-2 bg-orange-600 text-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] font-black uppercase text-[10px] md:text-[11px] tracking-[0.4em] mt-2 md:mt-4 hover:bg-black transition-all transform active:scale-[0.96] shadow-2xl shadow-orange-600/20 disabled:opacity-50"
            >
              {loading ? "INITIALIZING..." : "REGISTER PROFILE"}
            </button>
          </form>

          <div className="relative my-8 md:my-10 text-center">
            <div className={`absolute inset-y-1/2 w-full h-[1px] ${themeSeparator}`} />
            <span className={`relative ${isDark ? 'bg-[#0d0e12]' : 'bg-white'} px-4 md:px-6 text-zinc-700 text-[8px] font-black uppercase tracking-[0.5em]`}>OR SIGN UP WITH</span>
          </div>

          <button 
            onClick={handleGoogleSignup}
            type="button"
            className={`w-full ${themeGoogleBtn} p-4 md:p-5 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl group`}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 transition-transform group-hover:scale-110" alt="G" />
            Google Signup 
          </button>
        </div>

        <div className="mt-8 md:mt-10 text-center">
          <p className={`${themeTextSub} text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em]`}>
            Registered already? <Link to="/login" className={`${themeTextMain} hover:text-orange-600 ml-1 border-b ${isDark ? 'border-white/5' : 'border-black/10'} hover:border-orange-600 pb-0.5 transition-all`}>Login</Link>
          </p>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-6">
          <div className={`${isDark ? 'bg-[#0d0e12] border-white/10' : 'bg-white border-gray-200'} border rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300`}>
            <div className={`absolute top-0 left-0 right-0 rounded-t-[2.5rem] h-1.5 ${
              modal.type === "error" ? "bg-red-600" : "bg-orange-600"
            }`} />
            <h3 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tight mb-4 ${themeTextMain}`}>{modal.title}</h3>
            <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'} text-xs md:text-sm mb-8 font-medium`}>{modal.message}</p>
            <button onClick={closeModal} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] hover:bg-black transition-all">CONFIRM</button>
          </div>
        </div>
      )}
    </div>
  );
}
