import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', username: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) alert(" GOOGLE_AUTH_ERROR: " + error.message);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return alert(" ERROR: Passwords do not match.");

    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      alert(" AUTH_FAILURE: " + authError.message);
      setLoading(false);
    } else {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          phone_number: formData.phone,
          email_copy: formData.email 
        })
        .eq('id', authData.user.id);

      if (profileError) {
        alert(" PROFILE_SYNC_ERROR: " + profileError.message);
        setLoading(false);
      } else {
        alert(" DEPLOYMENT SUCCESSFUL: Check your email for verification.");
        navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 py-12 relative overflow-hidden text-white font-sans">
      
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] bg-white/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="w-full max-w-[520px] relative z-10 animate-in fade-in zoom-in duration-500">
        
        
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-5">
             <p className="text-[7px] font-black text-orange-600 uppercase tracking-[0.6em] animate-pulse"> CREATE ACCOUNT</p>
          </div>
          <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none">
            SIGN <span className="text-orange-600 font-black">UP NOW.</span>
          </h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-4">Create your user profile</p>
        </div>

       
        <div className="bg-[#0d0e12] p-8 md:p-12 rounded-[3.5rem] border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden">
          
          <form onSubmit={handleSignup} className="grid grid-cols-2 gap-x-4 gap-y-6">
            
            
            <div className="col-span-1 space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-4">First Name</label>
              <input 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800" 
                placeholder="first name" 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                required 
              />
            </div>

            <div className="col-span-1 space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-4">Last Name</label>
              <input 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800" 
                placeholder="last name" 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                required 
              />
            </div>

            
            <div className="col-span-2 space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-4">Username</label>
              <input 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800" 
                placeholder="username" 
                onChange={e => setFormData({...formData, username: e.target.value})} 
                required 
              />
            </div>

            
            <div className="col-span-2 space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-4"> Email</label>
              <input 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800" 
                placeholder="EMAIL@GMAIL.COM" 
                type="email" 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
              />
            </div>

            
            <div className="col-span-2 space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-4">Contact number</label>
              <input 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800" 
                placeholder="09XXXXXXXXX" 
                type="tel" 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                required 
              />
            </div>

            
            <div className="col-span-1 space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-4">Password</label>
              <input 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800" 
                placeholder="********" 
                type="password" 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required 
              />
            </div>

            <div className="col-span-1 space-y-2">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-4">Confirm Password</label>
              <input 
                className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-orange-600 transition shadow-inner placeholder:text-zinc-800" 
                placeholder="********" 
                type="password" 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                required 
              />
            </div>
            
            
            <button 
              type="submit"
              disabled={loading}
              className="col-span-2 bg-orange-600 text-white p-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.5em] mt-4 hover:bg-white hover:text-black transition-all transform active:scale-[0.96] shadow-2xl shadow-orange-600/20 disabled:opacity-50"
            >
              {loading ? "INITIALIZING..." : "REGISTER PROFILE"}
            </button>
          </form>

         
          <div className="relative my-10 text-center">
            <div className="absolute inset-y-1/2 w-full h-[1px] bg-white/5" />
            <span className="relative bg-[#0d0e12] px-6 text-zinc-700 text-[8px] font-black uppercase tracking-[0.5em]">Sign Up With</span>
          </div>

          
          <button 
            onClick={handleGoogleSignup}
            type="button"
            className="w-full bg-white text-black p-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-xl shadow-white/5 group"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              className="w-4 h-4 transition-transform group-hover:scale-110" 
              alt="G" 
            />
            Sign up with Google 
          </button>
        </div>

        
        <div className="mt-10 text-center">
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em]">
            Already registered? <Link to="/login" className="text-white hover:text-orange-600 ml-1 border-b border-white/5 hover:border-orange-600 pb-0.5 transition-all">Login Now</Link>
          </p>
        </div>
        
        
        <div className="absolute -bottom-12 left-0 right-0 flex justify-between opacity-10 px-4 pointer-events-none">
          <span className="text-[7px] font-mono tracking-widest text-white">SIGN UP</span>
          <span className="text-[7px] font-mono tracking-widest text-white">PEDALSTREET</span>
        </div>
      </div>
    </div>
  );
}