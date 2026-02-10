import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

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

  const handleCancelOrder = async (e, orderId) => {
    e.stopPropagation();
    if (window.confirm("🚨 RIDER, ABORT THIS MISSION? This cannot be undone.")) {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'CANCELLED' })
        .eq('id', orderId);

      if (!error) {
        fetchOrders();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 font-sans selection:bg-orange-600">
      <div className="max-w-4xl mx-auto">
        
        
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></div>
            <p className="text-orange-600 font-black text-[10px] tracking-[0.5em] uppercase italic">Personnel Stash</p>
          </div>
          <h2 className="text-7xl font-black italic uppercase tracking-tighter leading-none">
            MY <span className="text-white/20 font-outline-2">STASH.</span>
          </h2>
          <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-[0.4em] mt-4">Registry of Active & Past Deployments</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-[#0d0e12] border border-white/5 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[3rem]">
                <p className="text-zinc-600 font-black italic uppercase tracking-widest text-xs">Stash is Empty. Go Deploy Some Gear.</p>
              </div>
            ) : orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const items = order.order_items || [];
              
              return (
                <div 
                  key={order.id}
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className={`bg-[#0d0e12] border transition-all duration-700 cursor-pointer overflow-hidden group ${
                    isExpanded ? 'rounded-[3.5rem] border-orange-600/40 shadow-[0_30px_60px_-15px_rgba(234,88,12,0.2)]' : 'rounded-[2.5rem] border-white/5 hover:border-white/20'
                  }`}
                >
                  
                  <div className="p-8 md:p-10 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      
                      <div className="flex -space-x-5">
                        {items.slice(0, 3).map((item, i) => (
                          <div key={i} className="w-16 h-16 rounded-[1.25rem] border-4 border-[#0d0e12] bg-zinc-900 overflow-hidden shadow-2xl relative">
                            <img 
                              src={item.products?.image_url} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                              alt="" 
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                          {items.length} {items.length === 1 ? 'UNIT' : 'UNITS'} DEPLOYED
                        </h3>
                        <p className="text-[10px] font-mono text-zinc-600 font-bold uppercase tracking-widest">OPS_REF: {order.id.slice(0,8)}</p>
                      </div>
                    </div>

                    <div className="text-right hidden sm:flex items-center gap-10">
                      <div>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Settlement</p>
                        <p className="text-3xl font-black text-white italic tracking-tighter">₱{Number(order.total_amount).toLocaleString()}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-6 py-2 rounded-full tracking-[0.2em] shadow-sm ${
                        order.status === 'PENDING' ? 'bg-orange-600 text-white' : 
                        order.status === 'CANCELLED' ? 'bg-red-600/10 text-red-600 border border-red-600/20' : 
                        'bg-green-600 text-white'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                 
                  <div className={`transition-all duration-700 px-10 ${isExpanded ? 'max-h-[2500px] pb-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="h-[1px] w-full bg-white/5 mb-10" />
                    
                    <div className="grid grid-cols-1 gap-4">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-8 bg-white/[0.02] p-6 rounded-[2.5rem] border border-white/5 group/item hover:bg-white/[0.04] transition-colors">
                          <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-black border border-white/10 shrink-0">
                            <img 
                              src={item.products?.image_url} 
                              alt={item.products?.name} 
                              className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xl font-black uppercase italic text-white tracking-tight leading-tight">
                                  {item.products?.name || 'Unit Missing from Database'}
                                </h4>
                                <div className="flex gap-6 mt-3">
                                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Volume: {item.quantity}</p>
                                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Unit Price: ₱{Number(item.price).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-orange-600 uppercase tracking-[0.4em] italic">Drop Point Coords</p>
                          <p className="text-xs font-bold text-zinc-400 uppercase leading-relaxed font-mono">
                            ID: {order.phone} <br /> 
                            LOC: {order.address}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">Settlement Type</p>
                          <p className="text-xs font-bold text-white uppercase">{order.payment_method}</p>
                        </div>
                      </div>
                      
                      {order.status === 'PENDING' && (
                        <button 
                          onClick={(e) => handleCancelOrder(e, order.id)}
                          className="w-full md:w-auto bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] px-12 py-5 rounded-2xl hover:bg-white hover:text-black transition-all shadow-2xl shadow-red-600/20 active:scale-95"
                        >
                          Abort Mission
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