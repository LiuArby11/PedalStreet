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

  const deleteSelected = () => {
    if (selectedItems.length === 0) return;
    if (window.confirm(` PROMPT: Are you sure you want to purge ${selectedItems.length} item(s) from your stash?`)) {
      const remainingCart = cart.filter(item => 
        !selectedItems.includes(`${item.id}-${item.selectedSize}-${item.selectedColor}`)
      );
      setCart(remainingCart);
      setSelectedItems([]); 
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
          alert(` INVENTORY LIMIT: Max stock reached.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const ProgressBar = () => (
    <div className="max-w-2xl mx-auto mb-16 px-4">
      <div className="flex justify-between items-center relative">
        <div className="absolute h-[1px] w-full bg-white/10 top-1/2 -translate-y-1/2 z-0" />
        <div className="absolute h-[2px] w-[33%] bg-orange-600 top-1/2 -translate-y-1/2 z-0 shadow-[0_0_15px_rgba(234,88,12,0.5)] transition-all duration-1000" />
        {[
          { step: '01', label: 'Cart', active: true },
          { step: '02', label: 'Checkout', active: false },
          { step: '03', label: 'Payment', active: false }
        ].map((s, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-[10px] border-2 transition-all duration-700 ${s.active ? 'bg-orange-600 border-orange-600 text-white rotate-0 shadow-[0_0_20px_rgba(234,88,12,0.2)]' : 'bg-[#0a0b0d] border-white/10 text-gray-700 rotate-[15deg]'}`}>
              {s.step}
            </div>
            <span className={`absolute -bottom-8 font-black uppercase text-[7px] tracking-[0.3em] whitespace-nowrap ${s.active ? 'text-orange-600' : 'text-gray-800'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  if (!cart || cart.length === 0) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-10 space-y-6">
        <div className="inline-block p-5 rounded-[2.5rem] bg-white/5 border border-white/5 mb-4 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        </div>
        <h2 className="text-6xl md:text-7xl font-black italic uppercase text-white tracking-tighter opacity-10 leading-none">EMPTY Cart</h2>
        <button onClick={() => navigate('/')} className="group relative inline-flex items-center gap-4 bg-white text-black px-10 py-5 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-2xl overflow-hidden">
          <span className="relative z-10">BACK TO SHOPPING</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-black min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-6">
        <ProgressBar />

        <div className="mb-16 mt-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-orange-600 font-black uppercase text-[9px] tracking-[0.5em] mb-2 flex items-center gap-3 italic">
              <span className="w-6 h-[1px] bg-orange-600" /> INVENTORY_CART
            </p>
            <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] text-white">
              MY <span className="text-orange-600">CART.</span>
            </h1>
          </div>

          <div className="flex items-center gap-6 self-start md:mb-2">
            <button onClick={handleSelectAll} className="flex items-center gap-3 group cursor-pointer">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${isAllSelected ? 'bg-orange-600 border-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.3)]' : 'border-white/20 group-hover:border-orange-600'}`}>
                {isAllSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className={`font-black uppercase text-[9px] tracking-[0.3em] transition-colors ${isAllSelected ? 'text-white' : 'text-gray-500 group-hover:text-orange-600'}`}>
                {isAllSelected ? 'Deselect' : 'Select All'}
              </span>
            </button>

            {selectedItems.length > 0 && (
              <button 
                onClick={deleteSelected}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all group"
              >
                <span className="font-black uppercase text-[8px] tracking-widest text-red-500 group-hover:text-white">PURGE ({selectedItems.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 space-y-8">
            {cart.map((item) => {
              const itemKey = `${item.id}-${item.selectedSize}-${item.selectedColor}`;
              const isSelected = selectedItems.includes(itemKey);

              return (
                <div key={itemKey} className={`group relative transition-all duration-500 ${!isSelected ? 'opacity-30 grayscale scale-[0.98]' : ''}`}>
                  <div className="relative bg-[#0d0e12] rounded-[2.5rem] p-5 border border-white/5 group-hover:border-orange-600/30 transition-all duration-500">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      
                      <button onClick={() => toggleSelect(itemKey)} className={`w-8 h-8 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-orange-600 border-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.4)]' : 'bg-transparent border-white/10 hover:border-orange-600/50'}`}>
                        {isSelected && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </button>

                      <div className="relative h-48 w-full md:w-56 flex-shrink-0 overflow-hidden rounded-[1.5rem] bg-black">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1s]" />
                        <div className="absolute top-4 right-4">
                           <button onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)} className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-500 hover:text-red-500 transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        </div>
                      </div>

                      <div className="flex-grow w-full py-1">
                        <div className="mb-4">
                          <span className="text-[7px] font-black text-orange-600 uppercase tracking-[0.4em] mb-1 block italic opacity-60">ID: {item.id.toString().slice(0, 8)}</span>
                          <h3 className="font-black text-3xl md:text-4xl italic uppercase tracking-tighter text-white leading-none mb-3">{item.name}</h3>
                          <div className="flex gap-2">
                            <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">
                              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mr-2">SIZE</span>
                              <span className="text-[9px] font-black text-white uppercase italic">{item.selectedSize}</span>
                            </div>
                            <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md">
                              <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest mr-2">COLOR</span>
                              <span className="text-[9px] font-black text-white uppercase italic">{item.selectedColor}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row justify-between items-end pt-5 border-t border-white/5">
                          <div className="space-y-2">
                            <p className="text-[7px] font-black uppercase tracking-[0.4em] text-gray-600 italic">Qty</p>
                            <div className="flex items-center bg-black rounded-xl p-1 border border-white/10 w-fit">
                              <button onClick={() => updateQty(item.id, item.selectedSize, item.selectedColor, -1)} className="w-8 h-8 flex items-center justify-center font-black text-lg text-white hover:text-orange-600">-</button>
                              <span className="w-10 text-center font-black italic text-lg text-orange-600">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, item.selectedSize, item.selectedColor, 1)} className={`w-8 h-8 flex items-center justify-center font-black text-lg transition-colors ${item.quantity >= item.stock ? 'text-gray-800 cursor-not-allowed' : 'text-white hover:text-orange-600'}`}>+</button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[7px] font-black uppercase tracking-[0.4em] text-gray-600 mb-1 italic">Total</p>
                            <p className="text-3xl font-black italic text-white tracking-tighter leading-none">₱{(item.price * item.quantity).toLocaleString()}</p>
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
            <div className="bg-[#111216] rounded-[3rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/5 blur-[80px] rounded-full -mr-24 -mt-24" />
              <div className="relative z-10">
                <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-600 mb-12 flex items-center gap-3 italic"><span className="w-8 h-[1.5px] bg-orange-600" /> SUMMARY</h3>
                <div className="space-y-6 mb-12">
                  <div className="flex justify-between items-center opacity-40">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Subtotal</span>
                    <span className="text-lg font-black italic text-white">₱{total.toLocaleString()}</span>
                  </div>
                  <div className="pt-8 border-t border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-orange-600 mb-2 italic">Grand Total</p>
                    <span className="text-5xl md:text-6xl font-black italic text-white tracking-tighter leading-none block">₱{total.toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if(selectedItems.length === 0) return alert(" ERROR: Select items to deploy.");
                    const finalItems = cart.filter(item => selectedItems.includes(`${item.id}-${item.selectedSize}-${item.selectedColor}`));
                    navigate('/checkout', { state: { items: finalItems, total } });
                  }}
                  disabled={selectedItems.length === 0}
                  className="group relative w-full overflow-hidden bg-white text-black py-6 rounded-xl font-black uppercase tracking-[0.4em] text-[9px] transition-all hover:bg-orange-600 hover:text-white disabled:opacity-30 active:scale-95"
                >
                  <span className="relative z-10">Checkout &rarr;</span>
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