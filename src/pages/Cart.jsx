import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';

export default function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    if (cart.length > 0 && selectedItems.length === 0) {
      const allKeys = cart.map(item => `${item.id}-${item.selectedSize}-${item.selectedColor}`);
      setSelectedItems(allKeys);
    }
  }, [cart]);

  const isAllSelected = cart.length > 0 && selectedItems.length === cart.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      const allKeys = cart.map(item => `${item.id}-${item.selectedSize}-${item.selectedColor}`);
      setSelectedItems(allKeys);
    }
  };

  // --- DAGDAG: Delete Selected Logic ---
  const deleteSelected = () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`🚨 PROMPT: Are you sure you want to purge ${selectedItems.length} item(s) from your stash?`)) {
      const remainingCart = cart.filter(item => 
        !selectedItems.includes(`${item.id}-${item.selectedSize}-${item.selectedColor}`)
      );
      setCart(remainingCart);
      setSelectedItems([]); // Reset selection pagkatapos mag-delete
    }
  };

  const toggleSelect = (itemKey) => {
    setSelectedItems(prev => 
      prev.includes(itemKey) ? prev.filter(key => key !== itemKey) : [...prev, itemKey]
    );
  };

  const total = cart?.reduce((sum, item) => {
    const itemKey = `${item.id}-${item.selectedSize}-${item.selectedColor}`;
    return selectedItems.includes(itemKey) ? sum + (Number(item.price) * Number(item.quantity)) : sum;
  }, 0) || 0;

  const removeItem = (id, size, color) => {
    setCart(cart.filter((item) => !(item.id === id && item.selectedSize === size && item.selectedColor === color)));
    setSelectedItems(prev => prev.filter(key => key !== `${id}-${size}-${color}`));
  };

  const updateQty = (id, size, color, amount) => {
    setCart(cart.map(item => {
      if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
        const newQty = item.quantity + amount;
        if (newQty < 1) return item;
        if (newQty > item.stock) {
          alert(`🚨 INVENTORY_LIMIT: Max stock reached.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
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
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic text-xs border-2 transition-all duration-700 ${s.active ? 'bg-orange-600 border-orange-600 text-white rotate-0 shadow-[0_0_30px_rgba(234,88,12,0.3)]' : 'bg-[#0a0b0d] border-white/10 text-gray-700 rotate-[15deg]'}`}>
              {s.step}
            </div>
            <span className={`absolute -bottom-10 font-black uppercase text-[8px] tracking-[0.4em] whitespace-nowrap ${s.active ? 'text-orange-600' : 'text-gray-800'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (!cart || cart.length === 0) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="relative z-10 space-y-8">
        <div className="inline-block p-6 rounded-[3rem] bg-white/5 border border-white/5 mb-4 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        </div>
        <h2 className="text-8xl md:text-9xl font-black italic uppercase text-white tracking-tighter opacity-10 leading-none">DORMANT</h2>
        <button onClick={() => navigate('/')} className="group relative inline-flex items-center gap-4 bg-white text-black px-12 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-2xl overflow-hidden">
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

        <div className="mb-24 mt-32 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p className="text-orange-600 font-black uppercase text-[10px] tracking-[0.5em] mb-4 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-orange-600" /> SUPPLY_MANIFEST_V1.0
            </p>
            <h1 className="text-8xl md:text-[10rem] font-black italic uppercase tracking-tighter leading-[0.8] text-white">
              YOUR <span className="text-orange-600">STASH.</span>
            </h1>
          </div>

          <div className="flex items-center gap-8 self-start md:mb-4">
            {/* Select All */}
            <button onClick={handleSelectAll} className="flex items-center gap-4 group cursor-pointer">
              <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isAllSelected ? 'bg-orange-600 border-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.4)]' : 'border-white/20 group-hover:border-orange-600'}`}>
                {isAllSelected && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
              </div>
              <span className={`font-black uppercase text-[10px] tracking-[0.3em] transition-colors ${isAllSelected ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'}`}>
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
            </button>

            {/* --- DAGDAG: Delete Selected Button UI --- */}
            {selectedItems.length > 0 && (
              <button 
                onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="font-black uppercase text-[9px] tracking-widest text-red-500 group-hover:text-white">Purge ({selectedItems.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-8 space-y-12">
            {cart.map((item) => {
              const itemKey = `${item.id}-${item.selectedSize}-${item.selectedColor}`;
              const isSelected = selectedItems.includes(itemKey);

              return (
                <div key={itemKey} className={`group relative transition-all duration-700 ${!isSelected ? 'opacity-40 grayscale' : ''}`}>
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/20 to-transparent rounded-[3.5rem] blur opacity-0 group-hover:opacity-100 transition duration-1000" />
                  
                  <div className="relative bg-[#0d0e12] rounded-[3rem] p-6 border border-white/5 group-hover:border-orange-600/30 transition-all duration-500">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                      
                      <button onClick={() => toggleSelect(itemKey)} className={`w-10 h-10 rounded-xl border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-orange-600 border-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.5)]' : 'bg-transparent border-white/10 hover:border-orange-600/50'}`}>
                        {isSelected && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>

                      <div className="relative h-64 w-full md:w-80 flex-shrink-0 overflow-hidden rounded-[2.5rem] bg-black">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s] opacity-80 group-hover:opacity-100" />
                        <div className="absolute top-6 right-6">
                           <button onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-500 hover:text-red-500 transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        </div>
                      </div>

                      <div className="flex-grow w-full py-2">
                        <div className="mb-6">
                          <span className="text-[8px] font-black text-orange-600 uppercase tracking-[0.4em] mb-2 block italic">Item_Ref: {item.id.toString().slice(0, 8)}</span>
                          <h3 className="font-black text-4xl md:text-5xl italic uppercase tracking-tighter text-white leading-none mb-4">{item.name}</h3>
                          <div className="flex gap-4">
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Size</span>
                              <span className="text-[10px] font-black text-white uppercase italic">{item.selectedSize}</span>
                            </div>
                            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                              <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Color</span>
                              <span className="text-[10px] font-black text-white uppercase italic">{item.selectedColor}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-white/5">
                          <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 italic">Deployment_Qty</p>
                            <div className="flex items-center bg-black rounded-2xl p-1.5 border border-white/10 w-fit">
                              <button onClick={() => updateQty(item.id, item.selectedSize, item.selectedColor, -1)} className="w-12 h-12 flex items-center justify-center font-black text-xl text-white hover:text-orange-600">-</button>
                              <span className="w-14 text-center font-black italic text-2xl text-orange-600">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, item.selectedSize, item.selectedColor, 1)} className={`w-12 h-12 flex items-center justify-center font-black text-xl transition-colors ${item.quantity >= item.stock ? 'text-gray-800 cursor-not-allowed' : 'text-white hover:text-orange-600'}`}>+</button>
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
              );
            })}
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <div className="bg-[#111216] rounded-[4rem] p-10 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full -mr-32 -mt-32" />
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 mb-16 flex items-center gap-4 italic"><span className="w-12 h-[2px] bg-orange-600" /> MISSION_CONTROL</h3>
                <div className="space-y-8 mb-16">
                  <div className="flex justify-between items-center opacity-40">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Inventory_Value</span>
                    <span className="text-xl font-black italic text-white">₱{total.toLocaleString()}</span>
                  </div>
                  <div className="pt-10 border-t border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 mb-4 italic">Total_Investment</p>
                    <span className="text-7xl md:text-8xl font-black italic text-white tracking-tighter leading-none block">₱{total.toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if(selectedItems.length === 0) return alert("🚨 ERROR: Select items to deploy.");
                    const finalItems = cart.filter(item => selectedItems.includes(`${item.id}-${item.selectedSize}-${item.selectedColor}`));
                    navigate('/checkout', { state: { items: finalItems, total } });
                  }}
                  disabled={selectedItems.length === 0}
                  className="group relative w-full overflow-hidden bg-white text-black py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:bg-orange-600 hover:text-white disabled:opacity-30 active:scale-95"
                >
                  <span className="relative z-10">Initialize_Checkout &rarr;</span>
                  <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}