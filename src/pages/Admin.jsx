import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '', image_url: '', stock: 0 });
  const [vForm, setVForm] = useState({ code: '', discount_percent: '' });
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchVouchers();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
    setProducts(data || []);
  };

  const fetchVouchers = async () => {
    const { data } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false });
    setVouchers(data || []);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id (first_name, last_name, username),
          order_items (
            quantity, price, product_id,
            products!order_items_product_id_fkey (name, image_url)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Order Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const printWaybill = (order) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert("🚨 POP-UP BLOCKED! Enable pop-ups to print waybills.");
      return;
    }

    const subtotal = order.order_items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const discountAmount = subtotal - (order.total_amount || 0);

    const itemsHtml = order.order_items?.map(item => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #333;">
          <div style="font-weight: 900; font-style: italic; text-transform: uppercase;">${item.products?.name || 'Item deleted'}</div>
        </td>
        <td style="padding: 15px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
        <td style="padding: 15px; border-bottom: 1px solid #333; text-align: right;">₱${Number(item.price).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Waybill - ${order.id.slice(0,8)}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #000; background: #fff; }
            .header { border-bottom: 8px solid #000; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .brand { font-size: 45px; font-weight: 900; font-style: italic; letter-spacing: -2px; margin: 0; }
            .badge { background: #000; color: #fff; padding: 5px 15px; font-size: 12px; font-weight: 900; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            .total-row { font-size: 24px; font-weight: 900; border-top: 4px solid #000; margin-top: 20px; padding-top: 10px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div><h1 class="brand">PEDALSTREET.</h1><p>MANIFEST ID: ${order.id.toUpperCase()}</p></div>
            <div style="text-align: right"><div class="badge">Tactical Delivery</div><p>${new Date(order.created_at).toLocaleString()}</p></div>
          </div>
          <div style="margin: 40px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div><h4 style="margin-bottom: 5px; text-decoration: underline;">RECIPIENT</h4><strong>${order.profiles?.first_name} ${order.profiles?.last_name}</strong><br>${order.address}<br>T: ${order.phone}</div>
            <div style="text-align: right"><h4 style="margin-bottom: 5px; text-decoration: underline;">PAYMENT METHOD</h4><strong>${order.payment_method}</strong></div>
          </div>
          <table>
            <thead><tr style="background: #f4f4f4;"><th style="padding:15px;text-align:left">UNIT_DESCRIPTION</th><th style="padding:15px">QTY</th><th style="padding:15px;text-align:right">PRICE</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="width: 300px; margin-left: auto; margin-top: 30px;">
            <div style="display:flex; justify-content: space-between; margin-bottom: 10px;"><span>Subtotal:</span><span>₱${subtotal.toLocaleString()}</span></div>
            ${order.promo_applied ? `<div style="display:flex; justify-content: space-between; color: red;"><span>Discount:</span><span>-₱${discountAmount.toLocaleString()}</span></div>` : ''}
            <div class="total-row"><span>TOTAL:</span><span>₱${Number(order.total_amount).toLocaleString()}</span></div>
          </div>
          <div style="margin-top: 100px; border-top: 1px dashed #ccc; padding-top: 20px; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">*** Thank you for riding with PedalStreet ***</div>
          <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('vouchers').insert([{ 
      code: vForm.code.toUpperCase(), 
      discount_percent: vForm.discount_percent 
    }]);
    if (!error) {
      alert("PROMO DEPLOYED 🎫");
      setVForm({ code: '', discount_percent: '' });
      fetchVouchers();
    }
  };

  const updateOrderStatus = async (id, status) => {
    const orderToUpdate = orders.find(o => o.id === id);
    if (status === 'SHIPPED' && orderToUpdate.status === 'PENDING') {
      for (const item of orderToUpdate.order_items) {
        if (item.product_id) {
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
          if (prod) await supabase.from('products').update({ stock: prod.stock - item.quantity }).eq('id', item.product_id);
        }
      }
    }
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) { fetchOrders(); fetchProducts(); }
  };

  const deleteOrder = async (id) => {
    if (confirm("🚨 SCRAP THIS ORDER RECORD? This cannot be undone.")) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) fetchOrders();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const action = editingId ? supabase.from('products').update(form).eq('id', editingId) : supabase.from('products').insert([form]);
    const { error } = await action;
    if (!error) {
      alert(editingId ? "UNIT UPDATED ⚡" : "GEAR DEPLOYED ⚡");
      setForm({ name: '', price: '', category: '', description: '', image_url: '', stock: 0 });
      setEditingId(null);
      fetchProducts();
    }
  };

  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((a, b) => a + Number(b.total_amount), 0);
  const lowStockItems = products.filter(p => p.stock <= 5);
  const salesData = orders.filter(o => o.status === 'DELIVERED').slice(0, 10).map(o => ({
    date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: o.total_amount
  })).reverse();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#050505] text-white">
      
      <div className="lg:w-72 bg-[#0d0e12] border-r border-white/5 p-10 flex flex-col justify-between">
        <div className="space-y-12">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white">PEDAL<span className="text-orange-600">STREET.</span></h1>
            <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-[8px] font-black text-gray-500 tracking-[0.4em] uppercase">Control Center Active</p>
            </div>
          </div>

          <nav className="space-y-3">
            {[
              { id: 'dashboard', label: 'Overview', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
              { id: 'inventory', label: 'Gear Stash', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'orders', label: 'Live Dispatch', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
              { id: 'vouchers', label: 'Promo Node', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <svg className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-600 group-hover:text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-10 border-t border-white/5">
            <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest">© 2026 PS_GLOBAL_OPS</p>
        </div>
      </div>

      <div className="flex-1 p-8 lg:p-16 overflow-y-auto">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header>
                <p className="text-orange-600 font-black text-[10px] tracking-[0.5em] uppercase mb-2 italic">Performance Analytics</p>
                <h2 className="text-6xl font-black italic uppercase tracking-tighter">Command <span className="text-white/20 font-outline-2">Center.</span></h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#0d0e12] p-10 rounded-[3rem] border border-white/5 group hover:border-green-500/30 transition-all shadow-2xl">
                <p className="text-[9px] font-black text-gray-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Net Revenue
                </p>
                <h3 className="text-5xl font-black italic text-white tracking-tighter">₱{totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="bg-[#0d0e12] p-10 rounded-[3rem] border border-white/5 group hover:border-blue-500/30 transition-all shadow-2xl">
                <p className="text-[9px] font-black text-gray-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Vouchers In-Field
                </p>
                <h3 className="text-5xl font-black italic text-white tracking-tighter">{vouchers.length} Units</h3>
              </div>
              <div className="bg-[#0d0e12] p-10 rounded-[3rem] border border-white/5 group hover:border-red-500/30 transition-all shadow-2xl">
                <p className="text-[9px] font-black text-gray-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span> Critical Stock
                </p>
                <h3 className={`text-5xl font-black italic tracking-tighter ${lowStockItems.length > 0 ? 'text-red-500' : 'text-white'}`}>{lowStockItems.length}</h3>
              </div>
            </div>

            <div className="bg-[#0d0e12] p-12 rounded-[4rem] border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-12">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 italic">Financial Waveform</h2>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase text-orange-600"><span className="w-3 h-3 bg-orange-600 rounded-full"></span> Revenue</div>
                    </div>
                </div>
                <div className="h-96">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={salesData}>
                     <defs>
                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <XAxis dataKey="date" hide />
                     <Tooltip 
                        contentStyle={{background: '#0d0e12', border: '1px solid #333', borderRadius: '20px', padding: '20px'}}
                        itemStyle={{color: '#fff', fontWeight: '900'}}
                     />
                     <Area type="monotone" dataKey="amount" stroke="#ea580c" fill="url(#colorAmt)" strokeWidth={6} />
                   </AreaChart>
                 </ResponsiveContainer>
                </div>
            </div>
          </div>
        )}

        
        {activeTab === 'inventory' && (
          <div className="grid lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-10 duration-700">
              <div className="lg:col-span-4">
                <form onSubmit={handleSubmit} className="bg-[#0d0e12] p-10 rounded-[3rem] border border-white/5 sticky top-10 shadow-2xl">
                  <h2 className="text-2xl font-black mb-8 uppercase italic flex items-center gap-3">
                    <span className="w-2 h-8 bg-orange-600 inline-block"></span>
                    {editingId ? "Modify Unit" : "Deploy Gear"}
                  </h2>
                  <div className="space-y-5">
                    <div className="group">
                        <p className="text-[8px] font-black text-gray-600 uppercase mb-2 tracking-widest px-2">Nomenclature</p>
                        <input className="w-full bg-black border border-white/5 p-5 rounded-2xl text-white text-xs outline-none focus:border-orange-600 transition-all font-bold" placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <p className="text-[8px] font-black text-gray-600 uppercase mb-2 tracking-widest px-2">Valuation</p>
                        <input className="w-full bg-black border border-white/5 p-5 rounded-2xl text-white text-xs focus:border-orange-600 outline-none transition-all font-bold" type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                      </div>
                      <div className="group">
                        <p className="text-[8px] font-black text-gray-600 uppercase mb-2 tracking-widest px-2">Volume</p>
                        <input className="w-full bg-black border border-white/5 p-5 rounded-2xl text-white text-xs focus:border-orange-600 outline-none transition-all font-bold" type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                      </div>
                    </div>
                    <select className="w-full bg-black border border-white/5 p-5 rounded-2xl text-gray-400 text-xs font-bold outline-none appearance-none cursor-pointer" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                      <option value="">Select Category</option>
                      <option value="ROAD">ROAD OPS</option>
                      <option value="MTB">MTB OPS</option>
                      <option value="PARTS">COMPONENTS</option>
                      <option value="GEAR">TACTICAL GEAR</option>
                    </select>
                    <input className="w-full bg-black border border-white/5 p-5 rounded-2xl text-white text-xs font-bold outline-none" placeholder="Satellite Image URL" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} required />
                    <textarea className="w-full bg-black border border-white/5 p-5 rounded-2xl h-32 text-white text-xs font-bold outline-none" placeholder="Technical Specifications" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                    
                    <button className="w-full bg-white text-black p-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 shadow-xl">
                        {editingId ? "Update Asset" : "Initialize Deployment"}
                    </button>
                    {editingId && <button onClick={() => {setEditingId(null); setForm({ name: '', price: '', category: '', description: '', image_url: '', stock: 0 });}} className="w-full text-[9px] text-gray-600 font-black uppercase tracking-widest mt-4">Abort Mission</button>}
                  </div>
                </form>
              </div>

              <div className="lg:col-span-8 bg-[#0d0e12] rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
                 <table className="w-full text-left">
                   <thead className="bg-white/5 uppercase font-black text-gray-500 text-[9px] tracking-widest">
                     <tr><th className="p-10">Asset</th><th className="p-10">Inventory</th><th className="p-10 text-right">Actions</th></tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {products.map(p => (
                       <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                         <td className="p-10 flex items-center gap-6">
                           <div className="relative w-20 h-20 overflow-hidden rounded-2xl border border-white/5">
                                <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           </div>
                           <div>
                               <p className="text-[8px] font-black text-orange-600 mb-1 tracking-widest uppercase">{p.category}</p>
                               <p className="font-black italic uppercase text-lg text-white">{p.name}</p>
                               <p className="text-gray-500 font-bold text-xs mt-1">₱{Number(p.price).toLocaleString()}</p>
                           </div>
                         </td>
                         <td className="p-10">
                            <span className={`px-4 py-2 rounded-full text-[10px] font-black italic border ${p.stock <= 5 ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-green-500/50 text-green-500 bg-green-500/10'}`}>
                                {p.stock} UNITS_AVAIL
                            </span>
                         </td>
                         <td className="p-10 text-right">
                           <button onClick={() => {setEditingId(p.id); setForm(p);}} className="text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors mr-6">Modify</button>
                           <button onClick={async () => {if(confirm("Scrap?")) {await supabase.from('products').delete().eq('id', p.id); fetchProducts();}}} className="text-[10px] font-black uppercase text-red-600/50 hover:text-red-600 transition-colors">Scrap</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
          </div>
        )}

        
        {activeTab === 'orders' && (
          <div className="space-y-10 animate-in slide-in-from-right-10 duration-700">
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {['ALL', 'PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                <button 
                    key={s} 
                    onClick={() => setFilterStatus(s)} 
                    className={`px-10 py-4 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border transition-all ${filterStatus === s ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : 'text-gray-600 border-white/5 hover:border-white/20'}`}
                >
                    {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-10">
              {orders.filter(o => filterStatus === 'ALL' || o.status === filterStatus).map((order) => (
                <div key={order.id} className="bg-[#0d0e12] rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl relative">
                  
                  
                  <div className={`h-2 w-full ${
                    order.status === 'DELIVERED' ? 'bg-green-500' : 
                    order.status === 'CANCELLED' ? 'bg-red-600' : 
                    'bg-orange-600'
                  }`}></div>

                  <div className="p-10 flex flex-col md:flex-row justify-between md:items-center gap-8 border-b border-white/5">
                    <div className="flex items-center gap-6">
                        <div>
                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Logistics Status</p>
                            <span className={`text-[10px] font-black px-6 py-2 rounded-full uppercase italic ${
                              order.status === 'DELIVERED' ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 
                              order.status === 'CANCELLED' ? 'bg-red-600/10 text-red-600 border border-red-600/20' : 
                              'bg-orange-600/10 text-orange-600 border border-orange-600/20'
                            }`}>
                                {order.status}
                            </span>
                        </div>
                      {order.promo_applied && (
                        <div>
                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Promo Applied</p>
                            <span className="bg-blue-600/10 text-blue-400 border border-blue-600/20 text-[10px] font-black px-4 py-2 rounded-full uppercase italic">🎫 {order.promo_applied}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      
                      {order.status !== 'CANCELLED' && (
                        <>
                          <button onClick={() => printWaybill(order)} className="bg-blue-600 text-white text-[9px] font-black uppercase px-8 py-4 rounded-2xl hover:bg-white hover:text-black transition-all">
                            Print Manifest
                          </button>
                          
                          {order.status === 'PENDING' && (
                            <button onClick={() => updateOrderStatus(order.id, 'SHIPPED')} className="bg-white text-black text-[9px] font-black uppercase px-8 py-4 rounded-2xl hover:bg-orange-600 hover:text-white transition-all">
                              Initialize Shipment
                            </button>
                          )}
                          
                          {order.status === 'SHIPPED' && (
                            <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="bg-green-600 text-white text-[9px] font-black uppercase px-8 py-4 rounded-2xl transition-all">
                              Mark Finalized
                            </button>
                          )}
                        </>
                      )}

                      
                      {(order.status === 'CANCELLED' || order.status === 'DELIVERED') ? (
                        <button 
                          onClick={() => deleteOrder(order.id)} 
                          className="bg-red-600 text-white text-[9px] font-black uppercase px-8 py-4 rounded-2xl hover:bg-red-700 transition-all flex items-center gap-2"
                        >
                          <span>🗑️</span> Scrap Record
                        </button>
                      ) : (
                        <button 
                          onClick={() => deleteOrder(order.id)} 
                          className="w-12 h-12 flex items-center justify-center bg-red-600/10 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`grid md:grid-cols-3 divide-x divide-white/5 ${order.status === 'CANCELLED' ? 'opacity-40 grayscale' : ''}`}>
                    <div className="p-12">
                       <p className="text-[8px] font-black text-orange-600 uppercase mb-4 tracking-[0.4em] italic flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span> Recipient Info
                       </p>
                       <h3 className="text-3xl font-black italic uppercase leading-none text-white">{order.profiles?.first_name} {order.profiles?.last_name}</h3>
                       <p className="text-[10px] text-gray-500 mt-6 font-bold leading-relaxed tracking-wider">
                           📍 {order.address}<br/>
                           📞 {order.phone}
                       </p>
                    </div>

                    <div className="p-12">
                       <p className="text-[8px] font-black text-orange-600 uppercase mb-6 tracking-[0.4em] italic flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span> Unit Manifest
                       </p>
                       <div className="space-y-4">
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-center bg-black/40 p-3 rounded-2xl border border-white/5">
                            <img src={item.products?.image_url} className="w-12 h-12 object-cover rounded-xl" />
                            <div>
                                <p className="text-[10px] font-black uppercase italic text-white leading-tight">{item.products?.name}</p>
                                <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                       </div>
                    </div>

                    <div className="p-12 bg-white/[0.01]">
                       <p className="text-[8px] font-black text-orange-600 uppercase mb-4 tracking-[0.4em] italic">Settlement Total</p>
                       <p className="text-6xl font-black italic tracking-tighter text-white">₱{Number(order.total_amount).toLocaleString()}</p>
                       <p className="text-[9px] font-black text-gray-700 uppercase mt-4 tracking-widest">Confirmed via {order.payment_method}</p>
                    </div>
                  </div>
                  
                  {order.status === 'CANCELLED' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[120px] font-black italic text-red-600/10 uppercase tracking-tighter -rotate-12">Aborted</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        
        {activeTab === 'vouchers' && (
          <div className="grid lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
            <div className="lg:col-span-4">
              <form onSubmit={handleVoucherSubmit} className="bg-[#0d0e12] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                <h2 className="text-2xl font-black mb-8 uppercase italic flex items-center gap-3">
                    <span className="w-2 h-8 bg-blue-600 inline-block"></span>
                    Forge Promo
                </h2>
                <div className="space-y-6">
                  <div className="group">
                    <p className="text-[8px] font-black text-gray-600 uppercase mb-2 tracking-widest px-2">Encryption Code</p>
                    <input className="w-full bg-black border border-white/5 p-5 rounded-2xl text-white text-xs font-black uppercase tracking-widest outline-none focus:border-blue-600 transition-all" placeholder="e.g. PEDAL_FORCE_50" value={vForm.code} onChange={e => setVForm({...vForm, code: e.target.value})} required />
                  </div>
                  <div className="group">
                    <p className="text-[8px] font-black text-gray-600 uppercase mb-2 tracking-widest px-2">Discount Ratio (%)</p>
                    <input className="w-full bg-black border border-white/5 p-5 rounded-2xl text-white text-xs font-black focus:border-blue-600 outline-none transition-all" type="number" placeholder="Percentage" value={vForm.discount_percent} onChange={e => setVForm({...vForm, discount_percent: e.target.value})} required />
                  </div>
                  <button className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-xl active:scale-95">
                      Activate Promo Node
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-8 bg-[#0d0e12] rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
               <table className="w-full text-left">
                 <thead className="bg-white/5 uppercase font-black text-gray-500 text-[9px] tracking-widest">
                   <tr><th className="p-10">Promo Unit</th><th className="p-10">Power</th><th className="p-10 text-right">Node Status</th></tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {vouchers.map(v => (
                     <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                       <td className="p-10 font-black text-blue-500 italic text-2xl tracking-tighter">{v.code}</td>
                       <td className="p-10 font-black text-2xl italic tracking-tighter text-white">{v.discount_percent}% REDUCTION</td>
                       <td className="p-10 text-right">
                           <span className="bg-green-600/10 text-green-500 border border-green-500/30 px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest italic">Node_Active</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}