import { useNavigate } from 'react-router-dom';

export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  
  const total = cart?.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0) || 0;

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const updateQty = (id, amount) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item
    ));
  };

  
  const ProgressBar = () => (
    <div className="max-w-3xl mx-auto mb-20 px-4">
      <div className="flex justify-between items-center relative">
        <div className="absolute h-[1px] w-full bg-white/10 top-1/2 -translate-y-1/2 z-0" />
        <div className="absolute h-[2px] w-[33%] bg-orange-600 top-1/2 -translate-y-1/2 z-0 shadow-[0_0_20px_rgba(234,88,12,0.8)] transition-all duration-1000" />
        
        {[
          { step: '01', label: 'Stash', active: true },
          { step: '02', label: 'Logistics', active: false },
          { step: '03', label: 'Finalize', active: false }
        ].map((s, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-xs border-2 transition-all duration-700 rotate-[15deg] ${s.active ? 'bg-orange-600 border-orange-600 text-white rotate-0 shadow-[0_0_30px_rgba(234,88,12,0.3)]' : 'bg-[#0a0b0d] border-white/10 text-gray-700 group-hover:border-white/20'}`}>
              {s.step}
            </div>
            <span className={`absolute -bottom-10 font-black uppercase text-[8px] tracking-[0.4em] whitespace-nowrap transition-colors duration-500 ${s.active ? 'text-orange-600' : 'text-gray-800'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (!cart || cart.length === 0) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="relative z-10 space-y-8">
        <div className="inline-block p-6 rounded-[3rem] bg-white/5 border border-white/5 mb-4 animate-bounce">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h2 className="text-8xl md:text-9xl font-black italic uppercase text-white tracking-tighter opacity-10 leading-none select-none">DORMANT</h2>
        <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.5em] italic">No active gear detected in manifest</p>
        <button 
          onClick={() => navigate('/')} 
          className="group relative inline-flex items-center gap-4 bg-white text-black px-12 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-2xl overflow-hidden"
        >
          <span className="relative z-10">Deploy to Store</span>
          <div className="absolute inset-0 bg-orange-600 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-black min-h-screen">
      <div className="max-w-7xl mx-auto py-20 px-6">
        
        
        <ProgressBar />

       
        <div className="mb-24 mt-32">
          <p className="text-orange-600 font-black uppercase text-[10px] tracking-[0.5em] mb-4 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-orange-600" /> SUPPLY_MANIFEST_V1.0
          </p>
          <h1 className="text-8xl md:text-[10rem] font-black italic uppercase tracking-tighter leading-[0.8] text-white">
            YOUR <span className="text-orange-600">STASH.</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
         
          <div className="lg:col-span-8 space-y-12">
            {cart.map((item) => (
              <div key={item.id} className="group relative">
                
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/20 to-transparent rounded-[3.5rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
                
                <div className="relative bg-[#0d0e12] rounded-[3rem] p-6 border border-white/5 group-hover:border-orange-600/30 transition-all duration-500">
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    
                    
                    <div className="relative h-64 w-full md:w-80 flex-shrink-0 overflow-hidden rounded-[2.5rem] bg-black">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] opacity-80 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      <div className="absolute top-6 right-6">
                         <button onClick={() => removeItem(item.id)} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-500/50 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                         </button>
                      </div>
                    </div>

                    
                    <div className="flex-grow w-full py-2">
                      <div className="mb-8">
                        <span className="text-[8px] font-black text-orange-600 uppercase tracking-[0.4em] mb-2 block italic">Item_Ref: {item.id.toString().slice(0, 8)}</span>
                        <h3 className="font-black text-4xl md:text-5xl italic uppercase tracking-tighter text-white leading-none">
                          {item.name}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-white/5">
                        <div className="space-y-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 italic">Deployment_Qty</p>
                          <div className="flex items-center bg-black rounded-2xl p-1.5 border border-white/10 w-fit">
                            <button onClick={() => updateQty(item.id, -1)} className="w-12 h-12 flex items-center justify-center font-black text-xl text-white hover:text-orange-600 transition-colors">-</button>
                            <span className="w-14 text-center font-black italic text-2xl text-orange-600">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-12 h-12 flex items-center justify-center font-black text-xl text-white hover:text-orange-600 transition-colors">+</button>
                          </div>
                        </div>

                        <div className="md:text-right flex flex-col justify-end">
                          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 mb-2 italic">Unit_Subtotal</p>
                          <p className="text-5xl font-black italic text-white tracking-tighter leading-none">₱{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          
          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <div className="bg-[#111216] rounded-[4rem] p-10 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse" />
              
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 mb-16 flex items-center gap-4 italic">
                  <span className="w-12 h-[2px] bg-orange-600" /> MISSION_CONTROL
                </h3>
                
                <div className="space-y-8 mb-16">
                  <div className="flex justify-between items-center opacity-40">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inventory_Value</span>
                    <span className="text-xl font-black italic text-white">₱{total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center opacity-40">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Logistics_Fee</span>
                    <span className="text-green-500 text-[10px] font-black tracking-widest uppercase italic font-outline-1">Free_Of_Charge</span>
                  </div>
                  
                  <div className="pt-10 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 mb-4 italic">Total_Investment</p>
                    <span className="text-7xl md:text-8xl font-black italic text-white tracking-tighter leading-none block">
                      ₱{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/checkout')}
                  className="group relative w-full overflow-hidden bg-white text-black py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:bg-orange-600 hover:text-white shadow-2xl active:scale-95"
                >
                  <span className="relative z-10">Initialize_Checkout &rarr;</span>
                  <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                </button>
                
                <div className="mt-10 pt-10 border-t border-white/5 flex flex-col items-center">
                  <div className="flex gap-2 mb-6">
                    {[1,2,3,4].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-orange-600 animate-pulse' : 'bg-white/10'}`} />)}
                  </div>
                  <p className="text-[8px] text-center font-black uppercase tracking-[0.4em] text-gray-800 italic">
                    Secure_Node_Active // 256_Bit_Encrypted
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}