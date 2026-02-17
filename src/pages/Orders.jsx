import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

export default function Orders({ darkMode }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            product_id,
            selected_size,
            selected_color,
            products!order_items_product_id_fkey (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Deployment Retrieval Error:", error.message);
      } else {
        setOrders(data || []);
      }
    }
    setLoading(false);
  };

  const handleCancelOrder = (e, orderId) => {
    e.stopPropagation();
    setPendingAction(orderId);
    setModalError('');
    setModalOpen(true);
  };

  const releaseOrderItemStock = async (item) => {
    if (!item?.product_id) return;

    const rpcRelease = await supabase.rpc('release_product_stock', {
      p_product_id: Number(item.product_id),
      p_quantity: Number(item.quantity),
      p_size: item.selected_size || null,
      p_color: item.selected_color || null,
    });

    if (!rpcRelease.error) {
      if (rpcRelease.data?.ok === false) {
        throw new Error(rpcRelease.data?.error || 'Stock release failed.');
      }
      return;
    }

    if (!['42883', 'PGRST202'].includes(String(rpcRelease.error.code || ''))) {
      throw rpcRelease.error;
    }

    const { data: rollbackProduct, error: readError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single();

    if (readError) throw readError;

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: Number(rollbackProduct.stock) + Number(item.quantity) })
      .eq('id', item.product_id);

    if (updateError) throw updateError;
  };

  const cancelOrderWithRestore = async (orderId) => {
    const rpcCancel = await supabase.rpc('cancel_order_and_restore_stock', {
      p_order_id: String(orderId),
    });

    if (!rpcCancel.error) {
      if (rpcCancel.data?.ok === false) {
        throw new Error(rpcCancel.data?.error || 'Cancel failed.');
      }
      return { handledByRpc: true };
    }

    if (!['42883', 'PGRST202'].includes(String(rpcCancel.error.code || ''))) {
      throw rpcCancel.error;
    }

    return { handledByRpc: false };
  };

  const confirmCancel = async () => {
    if (!pendingAction) return;

    try {
      const orderToCancel = orders.find((o) => o.id === pendingAction);
      if (!orderToCancel) {
        throw new Error('Order not found.');
      }

      if (orderToCancel.status === 'CANCELLED') {
        setModalOpen(false);
        setPendingAction(null);
        return;
      }

      const cancelResult = await cancelOrderWithRestore(pendingAction);
      if (cancelResult.handledByRpc) {
        fetchOrders();
        setModalOpen(false);
        setPendingAction(null);
        setModalError('');
        return;
      }

      if (['PENDING', 'PROCESSING', 'SHIPPED'].includes(orderToCancel.status)) {
        for (const item of orderToCancel.order_items || []) {
          await releaseOrderItemStock(item);
        }
      }

      const { error } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', pendingAction);

      if (error) throw error;

      fetchOrders();
      setModalOpen(false);
      setPendingAction(null);
      setModalError('');
    } catch (err) {
      setModalError(err.message || 'Cancel failed. Please try again.');
    }
  };

  const isDark = darkMode === true;
  const themeBgMain = isDark ? 'bg-[#050505]' : 'bg-[#f4f4f7]';
  const themeCard = isDark ? 'bg-[#0d0e12] border-white/5' : 'bg-white border-gray-200 shadow-xl';
  const themeTextMain = isDark ? 'text-white' : 'text-gray-900';
  const themeTextSub = isDark ? 'text-zinc-500' : 'text-gray-600';
  const themeModal = isDark ? 'bg-[#0d0e12] border-white/10' : 'bg-white border-gray-200';
  const orderTimelineSteps = ['PROCESSING', 'SHIPPED', 'DELIVERED'];
  const statusTheme = {
    PENDING: 'bg-orange-600 text-white',
    PROCESSING: 'bg-blue-600 text-white',
    SHIPPED: 'bg-cyan-600 text-white',
    DELIVERED: 'bg-green-600 text-white',
    CANCELLED: 'bg-red-600/10 text-red-600 border border-red-600/20',
  };
  const statusRibbon = {
    PENDING: 'bg-orange-500',
    PROCESSING: 'bg-blue-500',
    SHIPPED: 'bg-cyan-500',
    DELIVERED: 'bg-green-500',
    CANCELLED: 'bg-red-500',
  };

  const getTimelineIndex = (status) => {
    if (status === 'PENDING') return 0;
    if (status === 'PROCESSING') return 0;
    if (status === 'SHIPPED') return 1;
    if (status === 'DELIVERED') return 2;
    return -1;
  };

  const ModernModal = () => (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-500 ${modalOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
      <div className={`relative ${themeModal} w-full max-w-md rounded-[3rem] p-8 md:p-10 shadow-2xl transition-all duration-500 transform ${modalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-600/20">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
          </div>
          <h3 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tighter mb-4 ${themeTextMain}`}>Confirm <span className="text-red-600">CANCEL?</span></h3>
          <p className={`${themeTextSub} text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed mb-10`}>
            You are about to terminate this order sequence. This action is irreversible within the system.
          </p>
          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={confirmCancel}
              className="w-full bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.4em] py-5 rounded-2xl hover:bg-black transition-all active:scale-95 shadow-xl shadow-red-600/20"
            >
              Confirm Cancellation
            </button>
            <button 
              onClick={() => setModalOpen(false)}
              className={`w-full ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-gray-100 text-gray-500'} text-[10px] font-black uppercase tracking-[0.4em] py-5 rounded-2xl hover:bg-orange-600 hover:text-white transition-all`}
            >
              Maintain Order
            </button>
            {modalError && (
              <p className="text-red-500 text-[9px] font-black uppercase tracking-[0.2em] mt-2">
                {modalError}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${themeBgMain} ${themeTextMain} p-4 md:p-12 font-sans selection:bg-orange-600 transition-colors duration-500`}>
      <ModernModal />
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-10 md:mb-16">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
            <p className="text-orange-600 font-black text-[9px] md:text-[10px] tracking-[0.5em] uppercase italic">Personnel Orders</p>
          </div>
          <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            MY <span className={`${isDark ? 'text-white/20' : 'text-black/10'} font-outline-2`}>ORDERS.</span>
          </h2>
          <p className={`${isDark ? 'text-zinc-700' : 'text-gray-400'} text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] mt-4`}>ORDER SETTLEMENT</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-32 ${isDark ? 'bg-[#0d0e12] border-white/5' : 'bg-white border-gray-100'} rounded-[2rem] md:rounded-[2.5rem] animate-pulse`} />
            ))}
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {orders.length === 0 ? (
              <div className={`text-center py-20 border-2 border-dashed ${isDark ? 'border-white/5 bg-white/[0.01]' : 'border-black/5 bg-white'} rounded-[2rem] md:rounded-[3rem]`}>
                <div className="max-w-md mx-auto px-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-600/10 border border-orange-600/20 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className={`${themeTextMain} font-black italic uppercase tracking-widest text-sm mb-2`}>No Orders Yet</p>
                  <p className={`${themeTextSub} text-[10px] font-bold uppercase tracking-[0.2em] mb-7`}>Ready to deploy your first order?</p>
                  <Link to="/" className="inline-block bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.35em] px-8 py-4 rounded-2xl hover:bg-black transition-all">
                    Shop Now
                  </Link>
                </div>
              </div>
            ) : orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const items = order.order_items || [];
              
              return (
                <div 
                  key={order.id}
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className={`${themeCard} border transition-all duration-700 cursor-pointer overflow-hidden group ${
                    isExpanded ? 'rounded-[2rem] md:rounded-[3.5rem] border-orange-600/40 shadow-[0_30px_60px_-15px_rgba(234,88,12,0.2)]' : 'rounded-[1.5rem] md:rounded-[2.5rem] hover:border-orange-600/30'
                  }`}
                >
                  <div className={`h-1 w-full ${statusRibbon[order.status] || 'bg-orange-500'}`} />
                  
                  <div className="p-6 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 md:gap-8">
                      <div className="flex -space-x-4 md:-space-x-5 shrink-0">
                        {items.slice(0, 3).map((item, i) => (
                          <div key={i} className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.25rem] border-2 md:border-4 ${isDark ? 'border-[#0d0e12]' : 'border-white'} bg-zinc-900 overflow-hidden shadow-2xl relative`}>
                            <img 
                              src={item.products?.image_url} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                              alt="" 
                            />
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-lg md:text-2xl font-black italic uppercase tracking-tighter ${themeTextMain} truncate`}>
                          {items.length} {items.length === 1 ? 'Product' : 'Products'}
                        </h3>
                        <p className="text-[8px] md:text-[10px] font-mono text-zinc-600 font-bold uppercase tracking-widest">Ref: {order.id.slice(0,8)}</p>
                        <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${themeTextSub}`}>
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-10 border-t sm:border-t-0 pt-4 sm:pt-0 border-white/5">
                      <div className="sm:text-right">
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Payment</p>
                        <p className={`text-xl md:text-3xl font-black ${themeTextMain} italic tracking-tighter`}>₱{Number(order.total_amount).toLocaleString()}</p>
                      </div>
                      <span className={`text-[8px] md:text-[9px] font-black uppercase px-4 md:px-6 py-2 rounded-full tracking-[0.2em] shadow-sm ${statusTheme[order.status] || 'bg-orange-600 text-white'}`}>
                        {order.status}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${themeTextSub} transition-transform duration-500 ${isExpanded ? 'rotate-180 text-orange-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className={`transition-all duration-700 px-6 md:px-10 ${isExpanded ? 'max-h-[3000px] pb-8 md:pb-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className={`h-[1px] w-full ${isDark ? 'bg-white/5' : 'bg-black/5'} mb-8 md:mb-10`} />

                    <div className={`mb-8 md:mb-10 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-gray-50'}`}>
                      <p className="text-[8px] md:text-[9px] font-black text-orange-600 uppercase tracking-[0.4em] italic mb-5">Order Progress</p>

                      {order.status === 'CANCELLED' ? (
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                          <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-red-600">Order Cancelled</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                          {orderTimelineSteps.map((step, idx) => {
                            const activeIndex = getTimelineIndex(order.status);
                            const isDone = activeIndex >= idx;
                            return (
                              <div key={step} className="space-y-2">
                                <div className={`h-1.5 rounded-full ${isDone ? 'bg-orange-600' : isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                                <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${isDone ? 'text-orange-600' : themeTextSub}`}>
                                  {step}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                      {items.map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-4 md:gap-8 ${isDark ? 'bg-white/[0.02]' : 'bg-gray-50'} p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border ${isDark ? 'border-white/5' : 'border-black/5'} group/item hover:border-orange-600/30 transition-colors`}>
                          <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1rem] md:rounded-[1.5rem] overflow-hidden bg-black border border-white/10 shrink-0 shadow-lg">
                            <img 
                              src={item.products?.image_url} 
                              alt={item.products?.name} 
                              className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm md:text-xl font-black uppercase italic ${themeTextMain} tracking-tight leading-tight truncate`}>
                              {item.products?.name || 'Unit Missing'}
                            </h4>
                            <div className="flex gap-4 md:gap-6 mt-1 md:mt-3">
                              <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">QTY: {item.quantity}</p>
                              <p className="text-[8px] md:text-[10px] font-black text-orange-600 uppercase tracking-widest">₱{Number(item.price).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`mt-8 md:mt-12 pt-8 md:pt-10 border-t ${isDark ? 'border-white/5' : 'border-black/5'} flex flex-col md:flex-row justify-between items-start md:items-end gap-8`}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-12 w-full md:w-auto">
                        <div className="space-y-1">
                          <p className="text-[8px] md:text-[9px] font-black text-orange-600 uppercase tracking-[0.4em] italic">Delivery Profile</p>
                          <p className={`text-[10px] md:text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-gray-600'} uppercase leading-relaxed font-mono`}>
                            TEL: {order.phone} <br /> 
                            LOC: {order.address}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] md:text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">Mode of Payment</p>
                          <p className={`text-[10px] md:text-xs font-bold ${themeTextMain} uppercase`}>{order.payment_method}</p>
                        </div>
                      </div>
                      
                      {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                        <button 
                          onClick={(e) => handleCancelOrder(e, order.id)}
                          className="w-full md:w-auto bg-red-600 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] px-10 md:px-12 py-5 rounded-xl md:rounded-2xl hover:bg-black transition-all shadow-2xl shadow-red-600/20 active:scale-95"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
