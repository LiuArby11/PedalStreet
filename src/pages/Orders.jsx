import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Orders({ darkMode }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

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
    setModalOpen(true);
  };

  const confirmCancel = async () => {
    if (!pendingAction) return;
    
    const { error } = await supabase
      .from('orders')
      .update({ status: 'CANCELLED' })
      .eq('id', pendingAction);

    if (!error) {
      fetchOrders();
    }
    setModalOpen(false);
    setPendingAction(null);
  };

  const isDark = darkMode === true;
  const themeBgMain = isDark ? 'bg-[#050505]' : 'bg-[#f4f4f7]';
  const themeCard = isDark ? 'bg-[#0d0e12] border-white/5' : 'bg-white border-gray-200 shadow-xl';
  const themeTextMain = isDark ? 'text-white' : 'text-gray-900';
  const themeTextSub = isDark ? 'text-zinc-500' : 'text-gray-600';
  const themeModal = isDark ? 'bg-[#0d0e12] border-white/10' : 'bg-white border-gray-200';

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
              <div className={`text-center py-20 border-2 border-dashed ${isDark ? 'border-white/5' : 'border-black/5'} rounded-[2rem] md:rounded-[3rem]`}>
                <p className="text-zinc-600 font-black italic uppercase tracking-widest text-[10px]">Cart is Empty. Go Deploy Some Gear.</p>
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
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-10 border-t sm:border-t-0 pt-4 sm:pt-0 border-white/5">
                      <div className="sm:text-right">
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Payment</p>
                        <p className={`text-xl md:text-3xl font-black ${themeTextMain} italic tracking-tighter`}>₱{Number(order.total_amount).toLocaleString()}</p>
                      </div>
                      <span className={`text-[8px] md:text-[9px] font-black uppercase px-4 md:px-6 py-2 rounded-full tracking-[0.2em] shadow-sm ${
                        order.status === 'PENDING' ? 'bg-orange-600 text-white' : 
                        order.status === 'CANCELLED' ? 'bg-red-600/10 text-red-600 border border-red-600/20' : 
                        'bg-green-600 text-white'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className={`transition-all duration-700 px-6 md:px-10 ${isExpanded ? 'max-h-[3000px] pb-8 md:pb-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className={`h-[1px] w-full ${isDark ? 'bg-white/5' : 'bg-black/5'} mb-8 md:mb-10`} />
                    
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
                      
                      {order.status === 'PENDING' && (
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