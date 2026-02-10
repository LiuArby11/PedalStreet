import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Checkout({ cart, setCart, session }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0); 
  const [appliedCode, setAppliedCode] = useState(null);
  const [promoError, setPromoError] = useState('');

  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    payment_method: 'COD',
    payment_details: ''
  });

  
  const ProgressBar = () => (
    <div className="max-w-3xl mx-auto mb-20 px-4">
      <div className="flex justify-between items-center relative">
        <div className="absolute h-[2px] w-full bg-white/5 top-1/2 -translate-y-1/2 z-0" />
        <div className="absolute h-[2px] w-[66%] bg-orange-600 top-1/2 -translate-y-1/2 z-0 shadow-[0_0_15px_rgba(234,88,12,0.5)]" />
        
        {[
          { step: '01', label: 'Stash', active: true, completed: true },
          { step: '02', label: 'Logistics', active: true, completed: false },
          { step: '03', label: 'Payment', active: false, completed: false }
        ].map((s, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black italic text-xs border-2 transition-all duration-500 ${s.active ? 'bg-orange-600 border-orange-600 text-white scale-110 shadow-[0_0_20px_rgba(234,88,12,0.4)]' : 'bg-black border-white/10 text-gray-600'}`}>
              {s.completed ? '✓' : s.step}
            </div>
            <span className={`absolute -bottom-8 font-black uppercase text-[9px] tracking-[0.3em] whitespace-nowrap ${s.active ? 'text-orange-600' : 'text-gray-700'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const applyPromoCode = async () => {
    setPromoError('');
    if (!promoCode) return;

    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .single();

    if (error || !data) {
      setPromoError('🚨 INVALID ENCRYPTION KEY');
      setDiscount(0);
      setAppliedCode(null);
    } else {
      setDiscount(data.discount_percent);
      setAppliedCode(data.code);
      setPromoCode('');
      alert(`⚡ SIGNAL STRENGTHENED: ${data.discount_percent}% DISCOUNT DEPLOYED!`);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    if (formData.payment_method === 'GCASH' && !formData.payment_details) {
      alert("🚨 AUTHENTICATION REQUIRED: Enter GCash Reference Number.");
      return;
    }

    setLoading(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: session.user.id,
          total_amount: total,
          status: 'PENDING',
          address: formData.address,
          phone: formData.phone,
          payment_method: formData.payment_method,
          payment_details: formData.payment_details,
          promo_applied: appliedCode
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      
      setCart([]);
      navigate('/order-success'); 
    } catch (err) {
      alert('CRITICAL ERROR: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 md:py-20 px-6 bg-black min-h-screen text-white">
      
      <ProgressBar />

      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-orange-600" />
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
            FINAL <span className="text-orange-600">DISPATCH.</span>
          </h1>
          <p className="text-gray-600 font-black uppercase text-[10px] tracking-[0.5em] mt-4">Order Status: Awaiting Confirmation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-[#0d0e12] border border-white/5 rounded-[3.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-600 opacity-20 group-hover:opacity-100 transition-opacity" />
            
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 mb-10 italic flex items-center gap-3">
               <span className="w-8 h-[1px] bg-orange-600" /> Destination Intel
            </h2>
            
            <form onSubmit={handleCheckout} className="space-y-8">
              <div className="space-y-6">
                <div className="relative group/input">
                  <textarea 
                    required 
                    className="w-full bg-black border border-white/10 rounded-[2rem] p-6 text-sm text-white outline-none focus:border-orange-600 min-h-[120px] transition-all placeholder:text-gray-700" 
                    placeholder="ENTER FULL COORDINATES (DELIVERY ADDRESS)" 
                    value={formData.address} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  />
                </div>
                
                <input 
                  type="text" 
                  required 
                  className="w-full bg-black border border-white/10 rounded-2xl p-6 text-sm text-white outline-none focus:border-orange-600 transition-all placeholder:text-gray-700 font-mono" 
                  placeholder="COMM_LINE (PHONE NUMBER)" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                />
              </div>

              <div className="pt-10 border-t border-white/5">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 mb-8 italic">Payment Protocol</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, payment_method: 'COD'})} 
                    className={`group relative py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all overflow-hidden ${formData.payment_method === 'COD' ? 'bg-orange-600 border-orange-600 text-white' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                  >
                    Cash on Delivery
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, payment_method: 'GCASH'})} 
                    className={`group relative py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all overflow-hidden ${formData.payment_method === 'GCASH' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30'}`}
                  >
                    GCash / Digital Wallet
                  </button>
                </div>

                {formData.payment_method === 'GCASH' && (
                  <div className="bg-blue-600/5 border border-blue-600/20 p-8 rounded-[2rem] mb-8 animate-in slide-in-from-top-4 duration-500">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] text-center mb-6">Receiver: 0912 345 6789</p>
                    <input 
                      type="text" 
                      className="w-full bg-black border border-blue-600/30 rounded-xl p-5 text-xs text-white text-center outline-none focus:border-blue-500 font-mono tracking-widest" 
                      placeholder="PASTE REFERENCE NUMBER" 
                      value={formData.payment_details} 
                      onChange={(e) => setFormData({...formData, payment_details: e.target.value})} 
                    />
                  </div>
                )}
              </div>

              <button 
                disabled={loading || cart.length === 0} 
                className="w-full group relative overflow-hidden bg-white text-black py-8 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs transition-all hover:bg-orange-600 hover:text-white shadow-2xl active:scale-[0.98]"
              >
                <span className="relative z-10">{loading ? 'TRANSMITTING DATA...' : 'AUTHORIZE DISPATCH ⚡'}</span>
                <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </form>
          </div>
        </div>

        
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-[#111216] border border-white/5 rounded-[3.5rem] p-10 shadow-2xl sticky top-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 mb-10 italic flex items-center justify-center gap-3">
               Package Manifest
            </h2>

            
            <div className="space-y-6 mb-12 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center group/item">
                  <div className="flex gap-6 items-center">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-black border border-white/5">
                      <img src={item.image_url} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" alt={item.name} />
                      <div className="absolute top-0 right-0 bg-orange-600 text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-bl-xl">
                        {item.quantity}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black italic uppercase text-white truncate max-w-[150px]">{item.name}</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">UNIT_PRICE: ₱{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-white italic">₱{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>

            
            <div className="pt-8 border-t border-white/10 mb-10">
              <div className="flex gap-3">
                <input 
                  type="text" 
                  className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 text-xs text-white outline-none focus:border-orange-600 transition-all font-mono" 
                  placeholder="ENCRYPTION_KEY (PROMO)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={applyPromoCode}
                  className="bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  LINK
                </button>
              </div>
              {promoError && <p className="text-red-500 text-[9px] font-black mt-3 italic animate-pulse">{promoError}</p>}
              {appliedCode && <p className="text-green-500 text-[9px] font-black mt-3 italic uppercase tracking-[0.2em]">⚡ SIGNAL STABLE: {appliedCode} ACTIVE</p>}
            </div>

            
            <div className="space-y-4 pt-8 border-t border-white/10 mb-10">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <span>Gross Value</span>
                <span className="text-white">₱{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-green-500">
                  <span>Deduction Applied</span>
                  <span>-₱{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <span>Logistics</span>
                <span className="text-green-500 italic">SECURED / FREE</span>
              </div>
            </div>

            <div className="p-8 bg-white/[0.02] rounded-[2.5rem] border border-white/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/10 blur-3xl rounded-full" />
               <div className="relative z-10 flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black uppercase text-orange-600 tracking-[0.4em] mb-2">Final Settlement</p>
                  <p className="text-5xl font-black italic tracking-tighter text-white">
                    ₱{total.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-gray-600 tracking-widest mb-1 italic">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase italic">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}