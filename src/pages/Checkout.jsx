import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Modal from "../components/Modal";
import ActionProgressBar from "../components/ActionProgressBar";

export default function Checkout({ cart, setCart, session, darkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: ""
  });

  const showModal = (type, title, message) => {
    setModal({ open: true, type, title, message });
  };

  const directBuyItem = location.state?.directBuyItem;
  const activeItems = directBuyItem ? [directBuyItem] : cart;

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState(null);
  const [promoError, setPromoError] = useState('');

  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    payment_method: 'COD',
    payment_details: ''
  });

  const isDark = darkMode === true;
  const themeBgMain = isDark ? 'bg-black' : 'bg-[#f8f9fa]';
  const themeCard = isDark ? 'bg-[#0d0e12] border-white/5' : 'bg-white border-gray-200 shadow-xl';
  const themeCardSecondary = isDark ? 'bg-[#111216] border-white/5' : 'bg-white border-gray-200 shadow-lg';
  const themeInput = isDark ? 'bg-black border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black';
  const themeTextMain = isDark ? 'text-white' : 'text-gray-900';
  const themeTextSub = isDark ? 'text-gray-500' : 'text-gray-600';
  const checkoutSignals = [
    { label: 'Stock Reserved', tone: 'text-green-500 border-green-500/30 bg-green-500/10' },
    { label: 'Encrypted Checkout', tone: 'text-blue-500 border-blue-500/30 bg-blue-500/10' },
    { label: 'Order Tracking Enabled', tone: 'text-orange-500 border-orange-500/30 bg-orange-500/10' },
  ];

  const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  useEffect(() => {
    if (activeItems.length === 0) {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [navigate]);

  const applyPromoCode = async () => {
    setPromoError('');
    if (!promoCode) return;

    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .single();

    if (error || !data) {
      setPromoError('INVALID VOUCHER CODE');
      setDiscount(0);
      setAppliedCode(null);
      showModal("error", "INVALID VOUCHER CODE", "Please enter a valid promo code.");
    } else {
      setDiscount(data.discount_percent);
      setAppliedCode(data.code);
      setPromoCode('');
      showModal("success", "PROMO APPLIED", `SIGNAL STRENGTHENED: ${data.discount_percent}% DISCOUNT DEPLOYED!`);
    }
  };

  const fetchProductForCheckout = async (productId) => {
    const withArchive = await supabase
      .from('products')
      .select('id, stock, is_archived, name')
      .eq('id', productId)
      .single();

    if (!withArchive.error) {
      return {
        data: withArchive.data,
        error: null,
      };
    }

    if (withArchive.error.code === '42703') {
      const fallback = await supabase
        .from('products')
        .select('id, stock, name')
        .eq('id', productId)
        .single();

      if (fallback.error) {
        return { data: null, error: fallback.error };
      }

      return {
        data: { ...fallback.data, is_archived: false },
        error: null,
      };
    }

    return { data: null, error: withArchive.error };
  };

  const reserveStockViaRpc = async (productId, quantity, size, color) => {
    const { data, error } = await supabase.rpc('reserve_product_stock', {
      p_product_id: Number(productId),
      p_quantity: Number(quantity),
      p_size: size || null,
      p_color: color || null,
    });

    if (error) return { ok: false, error };
    if (!data?.ok) return { ok: false, error: new Error(data?.error || 'Stock reservation failed.') };
    return { ok: true };
  };

  const releaseStockViaRpc = async (productId, quantity, size, color) => {
    const { data, error } = await supabase.rpc('release_product_stock', {
      p_product_id: Number(productId),
      p_quantity: Number(quantity),
      p_size: size || null,
      p_color: color || null,
    });

    if (error) return { ok: false, error };
    if (!data?.ok) return { ok: false, error: new Error(data?.error || 'Stock rollback failed.') };
    return { ok: true };
  };

  const reserveStockWithRetry = async (productId, quantity, label, size, color) => {
    const rpcReserve = await reserveStockViaRpc(productId, quantity, size, color);
    if (rpcReserve.ok) return { mode: 'rpc' };
    if (!['42883', 'PGRST202'].includes(String(rpcReserve.error?.code || ''))) {
      throw rpcReserve.error;
    }

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const { data: currentProduct, error: readError } = await fetchProductForCheckout(productId);
      if (readError) throw readError;

      if (currentProduct?.is_archived) {
        throw new Error(`Product unavailable: ${currentProduct.name || label}`);
      }

      const currentStock = Number(currentProduct.stock);
      const neededQty = Number(quantity);
      if (currentStock < neededQty) {
        throw new Error(`Insufficient stock for ${currentProduct.name || label}. Available: ${currentStock}`);
      }

      const nextStock = currentStock - neededQty;
      const { error: reserveError } = await supabase
        .from('products')
        .update({ stock: nextStock })
        .eq('id', productId)
        .eq('stock', currentProduct.stock);

      if (reserveError) throw reserveError;

      const { data: verifyProduct, error: verifyError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (verifyError) throw verifyError;
      if (Number(verifyProduct.stock) === nextStock) {
        return { mode: 'client' };
      }
    }

    throw new Error(`Stock reservation blocked for ${label}. Possible DB policy issue. Please run checkout_stock_rpc.sql in Supabase SQL Editor.`);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (activeItems.length === 0) return;

    if (formData.payment_method === 'GCASH' && !formData.payment_details) {
      showModal("error", "AUTHENTICATION REQUIRED", "Enter GCash Reference Number.");
      return;
    }

    setLoading(true);
    const deductedStocks = [];

    try {
      const demandByProduct = activeItems.reduce((acc, item) => {
        const itemSize = item.selectedSize || '';
        const itemColor = item.selectedColor || '';
        const key = `${item.id}__${itemSize}__${itemColor}`;
        if (!acc[key]) {
          acc[key] = {
            quantity: 0,
            name: item.name || 'Product',
            productId: item.id,
            size: itemSize,
            color: itemColor,
          };
        }
        acc[key].quantity += Number(item.quantity || 0);
        return acc;
      }, {});

      for (const [, demand] of Object.entries(demandByProduct)) {
        const reservation = await reserveStockWithRetry(
          demand.productId,
          demand.quantity,
          demand.name,
          demand.size,
          demand.color
        );

        deductedStocks.push({
          productId: demand.productId,
          quantity: Number(demand.quantity),
          size: demand.size,
          color: demand.color,
          mode: reservation?.mode || 'client',
        });
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: session.user.id,
          total_amount: total,
          status: 'PROCESSING',
          address: formData.address,
          phone: formData.phone,
          payment_method: formData.payment_method,
          payment_details: formData.payment_details,
          promo_applied: appliedCode
        }])
        .select().single();

      if (orderError) throw orderError;

      const orderItems = activeItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        selected_size: item.selectedSize || null,
        selected_color: item.selectedColor || null
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      if (!directBuyItem) {
        setCart([]);
      }

      navigate('/order-success');
    } catch (err) {
      for (const rollbackItem of deductedStocks) {
        try {
          if (rollbackItem.mode === 'rpc') {
            const releaseRpc = await releaseStockViaRpc(
              rollbackItem.productId,
              rollbackItem.quantity,
              rollbackItem.size,
              rollbackItem.color
            );
            if (!releaseRpc.ok) {
              console.error('Checkout rollback rpc error:', releaseRpc.error?.message || releaseRpc.error);
            }
          } else {
            const { data: rollbackProduct } = await supabase
              .from('products')
              .select('stock')
              .eq('id', rollbackItem.productId)
              .single();

            if (rollbackProduct) {
              await supabase
                .from('products')
                .update({ stock: Number(rollbackProduct.stock) + Number(rollbackItem.quantity) })
                .eq('id', rollbackItem.productId);
            }
          }
        } catch (rollbackErr) {
          console.error('Checkout rollback error:', rollbackErr.message);
        }
      }
      const errorMessage = err?.message || 'Checkout failed. Please try again.';
      showModal("error", "CRITICAL ERROR", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = () => (
    <div className="max-w-3xl mx-auto mb-16 md:mb-20 px-4">
      <div className="flex justify-between items-center relative">
        <div className={`absolute h-[2px] w-full ${isDark ? 'bg-white/5' : 'bg-black/5'} top-1/2 -translate-y-1/2 z-0`} />
        <div className="absolute h-[2px] w-[66%] bg-orange-600 top-1/2 -translate-y-1/2 z-0 shadow-[0_0_15px_rgba(234,88,12,0.5)]" />
        {[
          { step: '01', label: 'Cart', active: true, completed: true },
          { step: '02', label: 'Checkout', active: true, completed: false },
          { step: '03', label: 'Payment', active: false, completed: false }
        ].map((s, idx) => (
          <div key={idx} className="relative z-10 flex flex-col items-center">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black italic text-[10px] md:text-xs border-2 transition-all duration-500 ${s.active ? 'bg-orange-600 border-orange-600 text-white scale-110' : `${isDark ? 'bg-black border-white/10 text-gray-600' : 'bg-white border-gray-200 text-gray-400'}`}`}>
              {s.completed ? '✓' : s.step}
            </div>
            <span className={`absolute -bottom-7 md:-bottom-8 font-black uppercase text-[8px] md:text-[9px] tracking-[0.3em] whitespace-nowrap ${s.active ? 'text-orange-600' : themeTextSub}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`max-w-7xl mx-auto py-8 md:py-20 px-4 md:px-6 ${themeBgMain} min-h-screen ${themeTextMain} transition-colors duration-500`}>
      <ActionProgressBar active={loading} />
      <ProgressBar />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6">
        <div className="relative pl-4 md:pl-0">
          <div className="absolute left-0 md:-left-4 top-0 w-1 h-full bg-orange-600" />
          <h1 className="text-4xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
            {directBuyItem ? 'EXPRESS' : 'PRODUCT'} <br className="md:hidden" /> <span className="text-orange-600">CHECKOUT.</span>
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <p className={`${themeTextSub} font-black uppercase text-[8px] md:text-[10px] tracking-[0.5em]`}>
              {directBuyItem ? 'SECURE PACKAGE DELIVERY' : 'Checkout and Confirm Your Package'}
            </p>
            {directBuyItem && (
              <span className="bg-orange-600 text-white text-[7px] md:text-[8px] font-black px-2 py-0.5 rounded animate-pulse">DIRECT LINK ACTIVE</span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 md:mb-10 flex flex-wrap gap-2 md:gap-3">
        {checkoutSignals.map((signal) => (
          <span key={signal.label} className={`px-4 py-2 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${signal.tone}`}>
            {signal.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        <div className="lg:col-span-7 space-y-6 md:space-y-8 order-2 lg:order-1">
          <div className={`${themeCard} rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-2xl relative overflow-hidden group`}>
            <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 mb-8 md:mb-10 italic flex items-center gap-3">
               <span className="w-6 md:w-8 h-[1px] bg-orange-600" /> Delivery Details
            </h2>
            
            <form onSubmit={handleCheckout} className="space-y-6 md:space-y-8">
              <div className="space-y-4 md:space-y-6">
                <textarea 
                  required 
                  className={`w-full ${themeInput} rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 text-xs md:text-sm outline-none focus:border-orange-600 min-h-[120px] transition-all placeholder:text-gray-500`} 
                  placeholder="ENTER COMPLETE DELIVERY ADDRESS" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                />
                <input 
                  type="text" 
                  required 
                  className={`w-full ${themeInput} rounded-xl md:rounded-2xl p-5 md:p-6 text-xs md:text-sm outline-none focus:border-orange-600 transition-all placeholder:text-gray-500 font-mono`} 
                  placeholder="CONTACT NUMBER (+63)" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                />
              </div>

              <div className={`pt-8 md:pt-10 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-orange-600 mb-6 md:mb-8 italic">Mode of payment</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, payment_method: 'COD'})} 
                    className={`py-5 md:py-6 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${formData.payment_method === 'COD' ? 'bg-orange-600 border-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.3)]' : `bg-transparent ${isDark ? 'border-white/10' : 'border-black/10'} text-gray-500`}`}
                  >
                    Cash on Delivery
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, payment_method: 'GCASH'})} 
                    className={`py-5 md:py-6 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${formData.payment_method === 'GCASH' ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : `bg-transparent ${isDark ? 'border-white/10' : 'border-black/10'} text-gray-500`}`}
                  >
                    GCash / Online Transfer
                  </button>
                </div>

                {formData.payment_method === 'GCASH' && (
                  <div className={`bg-blue-600/5 border border-blue-600/20 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] mb-8`}>
                    <p className="text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] text-center mb-6 italic underline">GCash: 0912 345 6789 (Juan D.)</p>
                    <input 
                      type="text" 
                      className={`w-full ${isDark ? 'bg-black' : 'bg-white'} border border-blue-600/30 rounded-xl p-4 md:p-5 text-[10px] md:text-xs ${themeTextMain} text-center outline-none focus:border-blue-500 font-mono`} 
                      placeholder="ENTER GCASH REFERENCE NO." 
                      value={formData.payment_details} 
                      onChange={(e) => setFormData({...formData, payment_details: e.target.value})} 
                    />
                  </div>
                )}
              </div>

              <button 
                disabled={loading || activeItems.length === 0} 
                className={`w-full group relative overflow-hidden ${isDark ? 'bg-white text-black' : 'bg-black text-white'} py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] md:text-xs transition-all hover:bg-orange-600 hover:text-white shadow-2xl active:scale-[0.98]`}
              >
                <span className="relative z-10">{loading ? 'TRANSMITTING ENCRYPTED DATA...' : 'FINALIZE TRANSACTION'}</span>
                <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5 order-1 lg:order-2">
          <div className={`${themeCardSecondary} rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-2xl sticky top-6 md:top-10`}>
            <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-orange-600 mb-8 md:mb-10 italic flex items-center justify-center gap-3">
                PACKAGE CONTENTS
            </h2>

            <div className="space-y-4 md:space-y-6 mb-8 md:mb-12 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {activeItems.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className={`flex justify-between items-center group/item border-b ${isDark ? 'border-white/[0.03]' : 'border-black/[0.03]'} pb-4 md:pb-6 last:border-0`}>
                  <div className="flex gap-3 md:gap-4 items-center">
                    <div className={`relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0 overflow-hidden rounded-xl md:rounded-2xl ${isDark ? 'bg-black' : 'bg-gray-100'} border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                      <img src={item.image_url} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" alt={item.name} />
                      <div className="absolute -top-1 -right-1 bg-orange-600 text-[8px] md:text-[10px] font-black px-2 py-1 rounded-bl-lg shadow-lg text-white">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[10px] md:text-xs font-black italic uppercase ${themeTextMain} mb-1 truncate`}>{item.name}</p>
                      <div className="flex flex-wrap gap-1 md:gap-2">
                         {item.selectedSize && (
                           <span className={`${isDark ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-600'} text-[7px] md:text-[8px] px-2 py-1 rounded-md font-black uppercase`}>Size: {item.selectedSize}</span>
                         )}
                         {item.selectedColor && (
                           <span className={`${isDark ? 'bg-white/5 text-gray-400' : 'bg-black/5 text-gray-600'} text-[7px] md:text-[8px] px-2 py-1 rounded-md font-black uppercase`}>Color: {item.selectedColor}</span>
                         )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs md:text-sm font-black ${themeTextMain} italic`}>₱{(item.price * item.quantity).toLocaleString()}</p>
                    <p className={`text-[7px] md:text-[8px] ${themeTextSub} uppercase font-black`}>₱{item.price.toLocaleString()} / Unit</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`pt-6 md:pt-8 border-t ${isDark ? 'border-white/10' : 'border-black/10'} mb-6 md:mb-8`}>
              <div className="flex gap-2 md:gap-3">
                <input 
                  type="text" 
                  className={`flex-1 ${themeInput} rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs outline-none focus:border-orange-600 transition-all font-mono`} 
                  placeholder="VOUCHER CODE"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={applyPromoCode}
                  className={`${isDark ? 'bg-white/5 text-white border-white/10 hover:bg-white hover:text-black' : 'bg-black/5 text-black border-black/10 hover:bg-black hover:text-white'} border px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all`}
                >
                  APPLY
                </button>
              </div>
              {promoError && <p className="text-red-500 text-[8px] md:text-[9px] font-black mt-3 italic animate-pulse">{promoError}</p>}
              {appliedCode && <p className="text-green-500 text-[8px] md:text-[9px] font-black mt-3 italic uppercase tracking-[0.2em]">⚡ SIGNAL STABLE: {appliedCode} ACTIVE</p>}
            </div>

            <div className={`space-y-3 md:space-y-4 pt-2 md:pt-4 mb-6 md:mb-8 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ${themeTextSub}`}>
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className={themeTextMain}>₱{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-green-500">
                  <span>Voucher Discount</span>
                  <span>-₱{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Shipping Fee</span>
                <span className="text-green-500 italic">WAIVED / FREE</span>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-orange-600 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_20px_40px_rgba(234,88,12,0.2)]">
              <p className="text-[8px] md:text-[9px] font-black uppercase text-white/60 tracking-[0.4em] mb-2">Total Settlement</p>
              <div className="flex justify-between items-end">
                <p className="text-3xl md:text-5xl font-black italic tracking-tighter text-white">
                  ₱{total.toLocaleString()}
                </p>
                <div className="text-right hidden sm:block">
                   <p className="text-[7px] md:text-[8px] font-black text-white/40 uppercase tracking-widest">Auth Transaction</p>
                </div>
              </div>
            </div>

            <div className={`mt-5 p-5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white border-black/10'}`}>
              <p className="text-[8px] font-black uppercase tracking-[0.35em] text-orange-600 mb-3">Checkout Confidence</p>
              <div className="space-y-2">
                <p className={`text-[11px] font-bold ${themeTextSub}`}>Inventory is locked when you finalize to prevent overselling.</p>
                <p className={`text-[11px] font-bold ${themeTextSub}`}>If cancellation happens before delivery, stock is returned automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {modal.open && (
        <Modal modal={modal} setModal={setModal} darkMode={darkMode} />
      )}
    </div>
  );
}
