import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

export default function Admin({ darkMode }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const [storageImages, setStorageImages] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ name: '', price: '', category: '', description: '', image_url: '', stock: 0 });
  const [vForm, setVForm] = useState({ code: '', discount_percent: '' });

  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  
  const themeCard = darkMode ? 'bg-[#0d0e12] border-white/5 shadow-2xl' : 'bg-white border-gray-200 shadow-xl';
  const themeTextMain = darkMode ? 'text-white' : 'text-gray-900';
  const themeTextSub = darkMode ? 'text-gray-500' : 'text-gray-600';
  const themeInput = darkMode ? 'bg-black border-white/5 text-white' : 'bg-gray-100 border-gray-300 text-black';
  const themeSidebar = darkMode ? 'bg-[#0d0e12] border-white/5' : 'bg-white border-gray-200';

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchVouchers();
  }, []);

  const fetchStorageImages = async () => {
    const { data, error } = await supabase.storage.from('product-images').list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'desc' },
    });
    if (data) {
      setStorageImages(data);
    }
    if (error) console.error("Storage Error:", error.message);
  };

  useEffect(() => {
    if (showPicker) fetchStorageImages();
  }, [showPicker]);

  const handleUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`; 

      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) throw error;

      alert("SYNCED: Image uploaded and ready to use!");
      fetchStorageImages(); 
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

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
            selected_size, selected_color,
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
 
  const adjustStock = async (id, currentStock, amount) => {
    const newStock = Math.max(0, currentStock + amount);
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
    if (!error) fetchProducts();
  };

  const updateOrderStatus = async (id, status) => {
    const orderToUpdate = orders.find(o => o.id === id);
    
    if (status === 'SHIPPED' && orderToUpdate.status === 'PENDING') {
      for (const item of orderToUpdate.order_items) {
        if (item.product_id) {
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
          if (prod) await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', item.product_id);
        }
      }
    }

    if (status === 'CANCELLED' && (orderToUpdate.status === 'SHIPPED' || orderToUpdate.status === 'PENDING')) {
        for (const item of orderToUpdate.order_items) {
          if (item.product_id) {
            const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
            if (prod) await supabase.from('products').update({ stock: prod.stock + item.quantity }).eq('id', item.product_id);
          }
        }
    }

    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) { fetchOrders(); fetchProducts(); }
  };

  const printWaybill = (order) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert(" POP-UP BLOCKED! Enable pop-ups to print waybills.");
      return;
    }

    const subtotal = order.order_items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
    const discountAmount = subtotal - (order.total_amount || 0);

    const itemsHtml = order.order_items?.map(item => `
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #333;">
          <div style="font-weight: 900; font-style: italic; text-transform: uppercase;">${item.products?.name || 'Item deleted'}</div>
          <div style="font-size: 11px; margin-top: 5px; font-weight: bold; color: #555;">
            SPEC: ${item.selected_size || 'N/A'} | ${item.selected_color || 'N/A'}
          </div>
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
            <div style="text-align: right"><div class="badge"> Delivery</div><p>${new Date(order.created_at).toLocaleString()}</p></div>
          </div>
          <div style="margin: 40px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div><h4 style="margin-bottom: 5px; text-decoration: underline;">RECIPIENT</h4><strong>${order.profiles?.first_name} ${order.profiles?.last_name}</strong><br>${order.address}<br>T: ${order.phone}</div>
            <div style="text-align: right"><h4 style="margin-bottom: 5px; text-decoration: underline;">PAYMENT METHOD</h4><strong>${order.payment_method}</strong></div>
          </div>
          <table>
            <thead><tr style="background: #f4f4f4;"><th style="padding:15px;text-align:left">UNIT DESCRIPTION</th><th style="padding:15px">QTY</th><th style="padding:15px;text-align:right">PRICE</th></tr></thead>
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
      alert("PROMO DEPLOYED ");
      setVForm({ code: '', discount_percent: '' });
      fetchVouchers();
    }
  };

  const deleteOrder = async (id) => {
    if (confirm(" SCRAP THIS ORDER RECORD? This cannot be undone.")) {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (!error) fetchOrders();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock)
    };

    const action = editingId 
      ? supabase.from('products').update(payload).eq('id', editingId) 
      : supabase.from('products').insert([payload]);

    const result = await action;
    
    if (!result.error) {
      alert(editingId ? "UNIT UPDATED " : "PRODUCT DEPLOYED ");
      setForm({ name: '', price: '', category: '', description: '', image_url: '', stock: 0 });
      setEditingId(null);
      fetchProducts();
    } else {
      console.error("Deploy Error:", result.error.message);
      alert("DEPLOYMENT FAILED: Check Console");
    }
  };

  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((a, b) => a + Number(b.total_amount), 0);
  const lowStockItems = products.filter(p => p.stock <= 5);
  const salesData = orders.filter(o => o.status === 'DELIVERED').slice(0, 10).map(o => ({
    date: new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: o.total_amount
  })).reverse();

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen ${darkMode ? 'bg-[#050505]' : 'bg-[#f8f9fa]'} ${themeTextMain} transition-colors duration-500`}>
      
      <div className={`hidden lg:flex lg:w-72 ${themeSidebar} border-r p-10 flex-col justify-between sticky top-0 h-screen transition-colors`}>
        <div className="space-y-12">
          <div>
            <h1 className={`text-3xl font-black italic tracking-tighter ${themeTextMain}`}>PEDAL<span className="text-orange-600">STREET.</span></h1>
            <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className={`text-[8px] font-black ${themeTextSub} tracking-[0.4em] uppercase`}>PRODUCT AND ORDER MANAGEMENT</p>
            </div>
          </div>

          <nav className="space-y-3">
            {[
              { id: 'dashboard', label: 'Overview', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
              { id: 'inventory', label: 'PRODUCTS', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'orders', label: 'Live Dispatch', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
              { id: 'vouchers', label: 'Promo Voucher', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' }
            ].map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)]' : `text-gray-500 hover:text-orange-600 ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}`}
              >
                <svg className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-600 group-hover:text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className={`pt-10 border-t ${darkMode ? 'border-white/5' : 'border-black/5'}`}>
            <p className={`text-[8px] font-black ${darkMode ? 'text-gray-700' : 'text-gray-400'} uppercase tracking-widest`}>© 2026 PS_GLOBAL_OPS</p>
        </div>
      </div>

      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-[90] ${darkMode ? 'bg-[#0d0e12]/90' : 'bg-white/90'} backdrop-blur-xl border-t ${darkMode ? 'border-white/5' : 'border-gray-200'} p-4 flex justify-around`}>
        {[
          { id: 'dashboard', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          { id: 'inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
          { id: 'orders', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z' },
          { id: 'vouchers', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-xl ${activeTab === tab.id ? 'bg-orange-600 text-white' : 'text-gray-500'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} /></svg>
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 lg:p-16 overflow-y-auto pb-32 lg:pb-16">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-8 lg:space-y-12 animate-in fade-in duration-700">
            <header>
                <p className="text-orange-600 font-black text-[10px] tracking-[0.5em] uppercase mb-2 italic">Performance Analytics</p>
                <h2 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter">Command <span className={`${darkMode ? 'text-white/20' : 'text-black/10'} font-outline-2`}>Center.</span></h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <div className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] group hover:border-green-500/30 transition-all`}>
                <p className={`text-[9px] font-black ${themeTextSub} uppercase mb-4 tracking-widest flex items-center gap-2`}>
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Net Revenue
                </p>
                <h3 className={`text-4xl lg:text-5xl font-black italic ${themeTextMain} tracking-tighter`}>₱{totalRevenue.toLocaleString()}</h3>
              </div>
              <div className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] group hover:border-blue-500/30 transition-all`}>
                <p className={`text-[9px] font-black ${themeTextSub} uppercase mb-4 tracking-widest flex items-center gap-2`}>
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Vouchers 
                </p>
                <h3 className={`text-4xl lg:text-5xl font-black italic ${themeTextMain} tracking-tighter`}>{vouchers.length} Units</h3>
              </div>
              <div className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] border transition-all ${lowStockItems.length > 0 ? 'border-red-500/50 animate-pulse' : ''}`}>
                <p className={`text-[9px] font-black ${themeTextSub} uppercase mb-4 tracking-widest flex items-center gap-2`}>
                    <span className={`w-2 h-2 rounded-full ${lowStockItems.length > 0 ? 'bg-red-500 animate-ping' : 'bg-red-500'}`}></span> Products
                </p>
                <h3 className={`text-4xl lg:text-5xl font-black italic tracking-tighter ${lowStockItems.length > 0 ? 'text-red-500' : themeTextMain}`}>{lowStockItems.length}</h3>
              </div>
            </div>

            <div className={`${themeCard} p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[4rem]`}>
                <div className="h-64 lg:h-96">
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
                        contentStyle={{background: darkMode ? '#0d0e12' : '#fff', border: darkMode ? '1px solid #333' : '1px solid #ddd', borderRadius: '20px', padding: '10px'}}
                        itemStyle={{color: darkMode ? '#fff' : '#000', fontWeight: '900'}}
                     />
                     <Area type="monotone" dataKey="amount" stroke="#ea580c" fill="url(#colorAmt)" strokeWidth={6} />
                   </AreaChart>
                 </ResponsiveContainer>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
            
            <div className="relative">
              <input 
                className={`w-full ${themeCard} p-6 pl-14 rounded-3xl ${themeTextMain} text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-600 transition-all`}
                placeholder="SEARCH PRODUCT (NAME/CATEGORY)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                <div className="lg:col-span-4">
                  <form onSubmit={handleSubmit} className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] lg:sticky lg:top-10`}>
                    <h2 className="text-2xl font-black mb-8 uppercase italic flex items-center gap-3">
                      <span className="w-2 h-8 bg-orange-600 inline-block"></span>
                      {editingId ? "Modify Unit" : "ADD PRODUCT"}
                    </h2>
                    <div className="space-y-5">
                      <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs outline-none focus:border-orange-600 transition-all font-bold`} placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                      
                      <div className="grid grid-cols-2 gap-4">
                          <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs focus:border-orange-600 outline-none transition-all font-bold`} type="number" placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                          <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs focus:border-orange-600 outline-none transition-all font-bold`} type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                      </div>

                      <select className={`w-full ${themeInput} p-5 rounded-2xl text-xs font-bold outline-none cursor-pointer`} value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                        <option value="">Select Category</option>
                        <option value="ROAD">ROAD OPS</option>
                        <option value="MTB">MTB OPS</option>
                        <option value="PARTS">COMPONENTS</option>
                        <option value="GEAR">TACTICAL GEAR</option>
                      </select>

                      <div className="space-y-2">
                        <label className={`text-[10px] font-black ${themeTextSub} uppercase tracking-widest`}>Product Visual</label>
                        <div className="flex gap-2">
                          <input className={`flex-1 ${themeInput} p-5 rounded-2xl text-xs font-bold outline-none truncate`} placeholder="Select from Storage..." value={form.image_url} readOnly required />
                          <button type="button" onClick={() => setShowPicker(true)} className="bg-orange-600 px-4 lg:px-6 rounded-2xl text-[10px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-lg">Browse</button>
                        </div>
                      </div>

                      <textarea className={`w-full ${themeInput} p-5 rounded-2xl h-32 text-xs font-bold outline-none`} placeholder="DESCRIPTION" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                      
                      <button className={`w-full ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} p-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-orange-600 transition-all shadow-xl`}>
                          {editingId ? "Update Asset" : "Add Product"}
                      </button>
                      
                      {editingId && <button onClick={() => {setEditingId(null); setForm({ name: '', price: '', category: '', description: '', image_url: '', stock: 0 });}} className="w-full text-[9px] text-gray-600 font-black uppercase tracking-widest mt-4 underline">Abort Mission</button>}
                    </div>
                  </form>
                </div>

                <div className={`lg:col-span-8 ${themeCard} rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} uppercase font-black ${themeTextSub} text-[9px] tracking-widest`}>
                          <tr><th className="p-6 lg:p-10">Assets</th><th className="p-6 lg:p-10">Inventory Control</th><th className="p-6 lg:p-10 text-right">Actions</th></tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-200'}`}>
                          {products
                          .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()))
                          .map(p => (
                            <tr key={p.id} className={`${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'} transition-colors group`}>
                              <td className="p-6 lg:p-10 flex items-center gap-6">
                                  <div className={`relative w-16 h-16 lg:w-20 lg:h-20 overflow-hidden rounded-2xl border ${darkMode ? 'border-white/5 bg-black' : 'border-gray-200 bg-gray-100'}`}>
                                      <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80" alt={p.name} />
                                  </div>
                                  <div>
                                      <p className="text-[8px] font-black text-orange-600 mb-1 tracking-widest uppercase">{p.category}</p>
                                      <p className={`font-black italic uppercase text-base lg:text-lg ${themeTextMain}`}>{p.name}</p>
                                      <p className={`${themeTextSub} font-bold text-xs`}>₱{Number(p.price).toLocaleString()}</p>
                                  </div>
                              </td>
                              <td className="p-6 lg:p-10">
                                <div className="flex items-center gap-4">
                                  <button onClick={() => adjustStock(p.id, p.stock, -1)} className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-200 border-gray-300'} border flex items-center justify-center hover:bg-red-600 hover:text-white transition-all font-black`}>-</button>
                                  <span className={`min-w-[50px] lg:min-w-[60px] text-center px-3 py-2 rounded-full text-[9px] lg:text-[10px] font-black italic border ${p.stock <= 5 ? 'border-red-500 text-red-500 bg-red-500/10 animate-pulse' : 'border-green-500/50 text-green-500 bg-green-500/10'}`}>
                                      {p.stock} U
                                  </span>
                                  <button onClick={() => adjustStock(p.id, p.stock, 1)} className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-200 border-gray-300'} border flex items-center justify-center hover:bg-green-600 hover:text-white transition-all font-black`}>+</button>
                                </div>
                              </td>
                              <td className="p-6 lg:p-10 text-right">
                                <button onClick={() => {setEditingId(p.id); setForm(p);}} className={`text-[10px] font-black uppercase ${themeTextSub} hover:text-orange-600 transition-colors mr-4 lg:mr-6`}>EDIT</button>
                                <button onClick={async () => {if(confirm("Scrap?")) {await supabase.from('products').delete().eq('id', p.id); fetchProducts();}}} className="text-[10px] font-black uppercase text-red-600/50 hover:text-red-600 transition-colors">REMOVE</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-10 animate-in slide-in-from-right-10 duration-700">
            <div className="relative">
              <input 
                className={`w-full ${themeCard} p-6 pl-14 rounded-3xl ${themeTextMain} text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-600 shadow-2xl`}
                placeholder="SEARCH ID OR RECIPIENT..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {['ALL', 'PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                <button 
                    key={s} 
                    onClick={() => setFilterStatus(s)} 
                    className={`px-8 lg:px-10 py-4 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border transition-all flex-shrink-0 ${filterStatus === s ? 'bg-orange-600 text-white border-orange-600 shadow-lg' : `${themeTextSub} ${darkMode ? 'border-white/5' : 'border-gray-200'} hover:border-orange-600`}`}
                >
                    {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-10">
              {orders
              .filter(o => filterStatus === 'ALL' || o.status === filterStatus)
              .filter(o => o.id.toLowerCase().includes(orderSearch.toLowerCase()) || `${o.profiles?.first_name} ${o.profiles?.last_name}`.toLowerCase().includes(orderSearch.toLowerCase()))
              .map((order) => (
                <div key={order.id} className={`${themeCard} rounded-[3rem] lg:rounded-[4rem] overflow-hidden relative transition-colors`}>
                  <div className={`h-2 w-full ${order.status === 'DELIVERED' ? 'bg-green-500' : order.status === 'CANCELLED' ? 'bg-red-600' : 'bg-orange-600'}`}></div>

                  <div className={`p-6 lg:p-10 flex flex-col md:flex-row justify-between md:items-center gap-8 border-b ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>
                    <div>
                        <p className={`text-[8px] font-black ${themeTextSub} uppercase tracking-widest mb-1`}>Logistics Status</p>
                        <span className={`text-[10px] font-black px-6 py-2 rounded-full uppercase italic ${
                          order.status === 'DELIVERED' ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 
                          order.status === 'CANCELLED' ? 'bg-red-600/10 text-red-600 border border-red-600/20' : 
                          'bg-orange-600/10 text-orange-600 border border-orange-600/20 animate-pulse'
                        }`}>
                            {order.status}
                        </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      {order.status !== 'CANCELLED' && (
                        <>
                          <button onClick={() => printWaybill(order)} className="bg-blue-600 text-white text-[9px] font-black uppercase px-6 lg:px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all">Print Manifest</button>
                          {order.status === 'PENDING' && (
                            <button onClick={() => updateOrderStatus(order.id, 'SHIPPED')} className={`${darkMode ? 'bg-white text-black' : 'bg-black text-white'} text-[9px] font-black uppercase px-6 lg:px-8 py-4 rounded-2xl hover:bg-orange-600 hover:text-white transition-all`}>Initialize Shipment</button>
                          )}
                          {order.status === 'SHIPPED' && (
                            <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="bg-green-600 text-white text-[9px] font-black uppercase px-6 lg:px-8 py-4 rounded-2xl transition-all">Mark Finalized</button>
                          )}
                          {(order.status === 'PENDING' || order.status === 'SHIPPED') && (
                            <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')} className="bg-red-600 text-white text-[9px] font-black uppercase px-6 lg:px-8 py-4 rounded-2xl transition-all">Abort Dispatch</button>
                          )}
                        </>
                      )}
                      <button onClick={() => deleteOrder(order.id)} className="bg-red-600/10 text-red-600 w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-red-600 hover:text-white transition-all">🗑️</button>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x ${darkMode ? 'divide-white/5' : 'divide-gray-100'} ${order.status === 'CANCELLED' ? 'opacity-40 grayscale' : ''}`}>
                    <div className="p-8 lg:p-12">
                        <p className="text-[8px] font-black text-orange-600 uppercase mb-4 tracking-[0.4em] italic flex items-center gap-2">Recipient Info</p>
                        <h3 className={`text-2xl lg:text-3xl font-black italic uppercase leading-none ${themeTextMain}`}>{order.profiles?.first_name} {order.profiles?.last_name}</h3>
                        <p className={`text-[10px] ${themeTextSub} mt-6 font-bold leading-relaxed`}>📍 {order.address}<br/>📞 {order.phone}</p>
                    </div>

                    <div className="p-8 lg:p-12">
                        <p className="text-[8px] font-black text-orange-600 uppercase mb-6 tracking-[0.4em] italic">PRODUCT DETAILS</p>
                        <div className="space-y-4">
                         {order.order_items?.map((item, idx) => (
                            <div key={idx} className={`flex gap-4 items-center ${darkMode ? 'bg-black/40 border-white/5' : 'bg-gray-50 border-gray-200'} p-3 rounded-2xl border`}>
                             <img src={item.products?.image_url} className="w-12 h-12 object-cover rounded-xl" alt="" />
                             <div>
                                 <p className={`text-[10px] font-black uppercase italic ${themeTextMain} leading-tight`}>{item.products?.name}</p>
                                 <p className="text-[9px] font-bold text-orange-600 uppercase mt-1">Qty: {item.quantity}</p>
                             </div>
                            </div>
                         ))}
                        </div>
                    </div>

                    <div className={`p-8 lg:p-12 ${darkMode ? 'bg-white/[0.01]' : 'bg-gray-50/50'}`}>
                        <p className="text-[8px] font-black text-orange-600 uppercase mb-4 tracking-[0.4em] italic">Settlement</p>
                        <p className={`text-4xl lg:text-6xl font-black italic tracking-tighter ${themeTextMain}`}>₱{Number(order.total_amount).toLocaleString()}</p>
                        <p className={`text-[9px] font-black ${darkMode ? 'text-gray-700' : 'text-gray-400'} uppercase mt-4`}>{order.payment_method}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'vouchers' && (
          <div className="grid lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
            <div className="lg:col-span-4">
              <form onSubmit={handleVoucherSubmit} className={`${themeCard} p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem]`}>
                <h2 className="text-2xl font-black mb-8 uppercase italic">Create Voucher</h2>
                <div className="space-y-6">
                  <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-blue-600`} placeholder="PROMO_CODE" value={vForm.code} onChange={e => setVForm({...vForm, code: e.target.value})} required />
                  <input className={`w-full ${themeInput} p-5 rounded-2xl text-xs font-black focus:border-blue-600 outline-none`} type="number" placeholder="Percentage %" value={vForm.discount_percent} onChange={e => setVForm({...vForm, discount_percent: e.target.value})} required />
                  <button className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-blue-700 transition-all">Activate Voucher</button>
                </div>
              </form>
            </div>
            
            <div className={`lg:col-span-8 ${themeCard} rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className={`${darkMode ? 'bg-white/5' : 'bg-gray-100'} uppercase font-black ${themeTextSub} text-[9px] tracking-widest`}>
                      <tr><th className="p-6 lg:p-10">Promo Unit</th><th className="p-6 lg:p-10">PERCENTAGE</th><th className="p-6 lg:p-10 text-right">Status</th></tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-gray-200'}`}>
                      {vouchers.map(v => (
                        <tr key={v.id}>
                          <td className="p-6 lg:p-10 font-black text-blue-500 italic text-2xl">{v.code}</td>
                          <td className={`p-6 lg:p-10 font-black text-xl lg:text-2xl italic ${themeTextMain}`}>{v.discount_percent}% DEDUCTION</td>
                          <td className="p-6 lg:p-10 text-right"><span className="text-green-500 font-black uppercase text-[10px] italic">Active</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          </div>
        )}
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`${darkMode ? 'bg-[#0d0e12] border-white/10' : 'bg-white border-gray-200'} w-full max-w-4xl max-h-[85vh] rounded-[2rem] lg:rounded-[3rem] flex flex-col overflow-hidden shadow-2xl`}>
            <div className={`p-6 lg:p-10 border-b ${darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50'} flex flex-col md:flex-row justify-between items-center gap-6`}>
              <div>
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${themeTextMain}`}>Asset <span className="text-orange-600">Library.</span></h3>
                <p className={`text-[9px] font-black ${themeTextSub} uppercase tracking-widest mt-1`}>Source: bucket/product-images</p>
              </div>

              <div className="flex items-center gap-4">
                <label className={`cursor-pointer ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} px-6 lg:px-8 py-3 lg:py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-orange-600 transition-all flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                  {uploading ? 'UPLOADING...' : 'UPLOAD NEW FILE'}
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                </label>

                <button onClick={() => setShowPicker(false)} className={`bg-white/5 hover:bg-red-600 ${themeTextMain} px-6 py-3 lg:py-4 rounded-2xl text-[10px] font-black uppercase transition-all`}>Close [X]</button>
              </div>
            </div>
            
            <div className="p-6 lg:p-10 overflow-y-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 custom-scrollbar min-h-[400px]">
              {storageImages.length === 0 && !uploading && <p className="col-span-full text-center text-gray-500 py-20 font-black uppercase italic tracking-widest">No assets found in storage...</p>}
              
              {storageImages.map((img) => {
                const publicUrl = supabase.storage.from('product-images').getPublicUrl(img.name).data.publicUrl;
                return (
                  <div 
                    key={img.id} 
                    onClick={() => {
                      setForm({...form, image_url: publicUrl});
                      setShowPicker(false);
                    }}
                    className="group cursor-pointer space-y-3"
                  >
                    <div className={`aspect-square rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border-4 transition-all duration-300 shadow-2xl ${form.image_url === publicUrl ? 'border-orange-600 scale-95' : 'border-transparent group-hover:border-orange-600/50'}`}>
                      <img src={publicUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={img.name} />
                    </div>
                    <p className={`text-[9px] font-black ${themeTextSub} truncate uppercase text-center px-2`}>{img.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}