import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile({ userProfile, session, darkMode }) {
  const [loading, setLoading] = useState(false);
  const [profileRecord, setProfileRecord] = useState(userProfile || null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    phone: '',
  });

  const [modal, setModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: ""
  });

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  useEffect(() => {
    if (userProfile) {
      setProfileRecord(userProfile);
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        username: userProfile.username || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile]);

  useEffect(() => {
    const hydrateProfile = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, username, phone, is_admin')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && data) {
        setProfileRecord(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          username: data.username || '',
          phone: data.phone || '',
        });
        return;
      }

      const meta = session.user.user_metadata || {};
      setFormData((prev) => ({
        first_name: prev.first_name || meta.firstName || meta.first_name || '',
        last_name: prev.last_name || meta.lastName || meta.last_name || '',
        username: prev.username || meta.username || '',
        phone: prev.phone || meta.phone || '',
      }));
    };

    hydrateProfile();
  }, [session]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const beforeData = {
      first_name: profileRecord?.first_name || '',
      last_name: profileRecord?.last_name || '',
      username: profileRecord?.username || '',
      phone: profileRecord?.phone || '',
      is_admin: !!profileRecord?.is_admin,
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        phone: formData.phone,
      })
      .eq('id', session.user.id);

    if (error) {
      showModal("error", "SYNC FAILED", error.message);
    } else {
      if (profileRecord?.is_admin) {
        const actorName = [formData.first_name, formData.last_name].filter(Boolean).join(' ').trim() || formData.username || session?.user?.email || 'Admin';
        await supabase.from('admin_audit_logs').insert([{
          action: 'PROFILE_UPDATE',
          entity_type: 'PROFILE',
          entity_id: session.user.id,
          actor_id: session.user.id,
          actor_email: session?.user?.email || null,
          actor_name: actorName,
          before_data: beforeData,
          after_data: {
            ...formData,
            is_admin: true,
          },
          metadata: {
            source: 'profile_page',
          },
        }]);
      }
      setProfileRecord((prev) => ({ ...(prev || {}), ...formData }));
      showModal("success", "PROFILE UPDATED", "Your identity has been successfully updated.");
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
    setLoading(false);
  };

  const themeBgMain = darkMode ? 'bg-[#0a0b0d]' : 'bg-[#f4f4f4]';
  const themeCard = darkMode ? 'bg-[#0d0e12] border-white/5' : 'bg-white border-gray-200';
  const themeTextMain = darkMode ? 'text-white' : 'text-gray-900';
  const themeTextSub = darkMode ? 'text-gray-500' : 'text-gray-600';
  const themeInput = darkMode ? 'bg-black/50 border-white/5 text-white' : 'bg-gray-100 border-gray-300 text-black';
  const themeButton = darkMode ? 'bg-white text-black' : 'bg-black text-white';

  return (
    <div className={`min-h-screen ${themeBgMain} pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6 transition-colors duration-500`}>
      <div className="max-w-xl mx-auto">
        <div className={`${themeCard} border rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-500`}>
          
          <div className="mb-8 md:mb-10">
            <h1 className={`text-3xl md:text-4xl font-black italic uppercase tracking-tighter ${themeTextMain}`}>
              {profileRecord?.is_admin ? 'ADMIN' : 'USER'} <span className="text-orange-600">PROFILE.</span>
            </h1>
            <p className={`text-[8px] md:text-[9px] font-black ${themeTextSub} uppercase tracking-[0.4em] mt-2`}>
              EDIT INFORMATION
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest ml-2">First Name</label>
                <input 
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold outline-none focus:border-orange-600 transition-all`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest ml-2">Last Name</label>
                <input 
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold outline-none focus:border-orange-600 transition-all`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest ml-2">Username</label>
              <input 
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold outline-none focus:border-orange-600 transition-all`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest ml-2">Phone Number</label>
              <input 
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className={`w-full ${themeInput} border p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[11px] md:text-xs font-bold outline-none focus:border-orange-600 transition-all`}
              />
            </div>

            <button 
              disabled={loading}
              className={`w-full ${themeButton} py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.3em] text-[9px] md:text-[10px] hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 shadow-xl disabled:opacity-50 mt-4`}
            >
              {loading ? "SYNCING..." : "UPDATE PROFILE"}
            </button>
          </form>

          <div className={`mt-8 md:mt-10 pt-8 md:pt-10 border-t ${darkMode ? 'border-white/5' : 'border-gray-200'} flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center`}>
            <div>
              <p className={`text-[9px] md:text-[10px] font-black ${themeTextMain} uppercase italic`}>Security</p>
              <p className={`text-[7px] md:text-[8px] font-bold ${themeTextSub} uppercase`}>Manage your PASSWORD</p>
            </div>
            <button 
              onClick={() => window.location.href = '/update-password'}
              className="w-full sm:w-auto text-[8px] md:text-[9px] font-black text-orange-600 uppercase border border-orange-600/20 px-4 py-2 rounded-lg hover:bg-orange-600 hover:text-white transition-all text-center"
            >
              Update Password
            </button>
          </div>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[200] px-6">
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
              onClick={() => setModal({ ...modal, open: false })}
              className={`w-full ${themeButton} py-4 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all`}
            >
              ACKNOWLEDGE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
