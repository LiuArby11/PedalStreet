import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

export default function Home({ isAdmin, session, darkMode }) { 
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState(['ALL']);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const userName =
    session?.user?.user_metadata?.display_name ||
    session?.user?.email?.split('@')[0] ||
    'User';

  const themeBgMain = darkMode ? 'bg-[#0a0b0d]' : 'bg-[#f4f4f4]';
  const themeCard = darkMode ? 'bg-[#111216] border-white/5 shadow-2xl' : 'bg-white border-gray-200 shadow-xl';
  const themeTextMain = darkMode ? 'text-white' : 'text-gray-900';
  const themeTextSub = darkMode ? 'text-gray-500' : 'text-gray-600';
  const themeInput = darkMode ? 'bg-black border-white/5 text-white' : 'bg-gray-100 border-gray-300 text-black';
  const themeHeroOverlay = darkMode ? 'bg-black/60' : 'bg-white/20';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    let result = products;
    if (activeCategory !== 'ALL') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery) {
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [searchQuery, activeCategory, products]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory('ALL');
    }
  }, [categories, activeCategory]);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*');
    const activeProducts = (data || []).filter((p) => !p.is_archived);
    setProducts(activeProducts);
    setFilteredProducts(activeProducts);
    setLoading(false);
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('code')
        .eq('is_active', true)
        .order('code', { ascending: true });
      if (error) throw error;
      const dynamicCategories = (data || []).map((item) => item.code).filter(Boolean);
      if (dynamicCategories.length > 0) {
        setCategories(['ALL', ...dynamicCategories]);
      }
    } catch (err) {
      console.error("Category Fetch Error:", err.message);
    }
  }
  return (
    <div className={`${themeBgMain} min-h-screen transition-colors duration-500`}>
      
      <section className={`relative min-h-[70vh] md:min-h-screen border-b ${darkMode ? 'border-white/5' : 'border-black/5'} overflow-hidden bg-[url('/bghero.png')] bg-cover bg-center bg-no-repeat`}>
        <div className={`absolute inset-0 ${themeHeroOverlay} transition-colors duration-500`}></div>
        
        <div className="relative max-w-7xl mx-auto grid md:grid-cols-2 items-center min-h-[70vh] md:min-h-[95vh] px-6 py-20 md:py-0">
          <div className="z-20 flex flex-col gap-6 md:gap-8 text-left">
            <div className="flex flex-col">
              <h1 className={`text-5xl md:text-8xl font-black italic uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-black'} leading-[0.9] md:leading-[0.85]`}>
                PEDAL<span className="text-orange-600">STREET.</span>
              </h1>
              <span className={`mt-2 text-2xl md:text-5xl font-bold italic tracking-[-0.05em] ${darkMode ? 'text-gray-300' : 'text-gray-800'} animate-bottom-glow`}>
                PUSH BEYOND LIMIT
              </span>
            </div>
            
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} italic font-medium text-sm md:text-base mt-4 md:mt-10 tracking-tight`}>
              Welcome back, {' '}
              <span className={`${darkMode ? 'text-white' : 'text-black'} font-black italic uppercase`}>
                {userName}
              </span>.
              Your premium tactical cycling gear is ready.
            </p>

            <div className="flex flex-wrap gap-3">
              <a href="#inventory" className={`inline-block italic ${darkMode ? 'bg-white text-black' : 'bg-black text-white'} px-6 py-3 md:px-5 md:py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 shadow-2xl`}>
                Shop Now
              </a>
              {!isAdmin && (
                <Link to="/orders" className={`inline-block italic ${darkMode ? 'bg-white/[0.05] border-white/10 text-white' : 'bg-white border-black/10 text-black'} border px-6 py-3 md:px-5 md:py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:border-orange-600 hover:text-orange-600 transition-all`}>
                  Track Orders
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className={`relative w-full border-t ${darkMode ? 'border-white/5 bg-black' : 'border-black/5 bg-white'} transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="flex flex-col gap-8 md:gap-12">
            <img src="/gear.png" alt="Drive Unit" className={`w-full max-w-[280px] md:max-w-md object-contain mx-auto md:mx-0 ${!darkMode ? 'brightness-90' : ''}`} />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8">
              {[
                { label: 'Weight', val: '16.9 kg' },
                { label: 'Stack', val: '571.2' },
                { label: 'CC', val: '550' },
                { label: 'Reach', val: '380' }
              ].map((stat, i) => (
                <div key={i}>
                  <p className={`text-3xl md:text-4xl font-black italic tracking-tighter ${themeTextMain}`}>{stat.val}</p>
                  <p className={`text-[10px] uppercase tracking-[0.3em] ${themeTextSub} mt-2`}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="md:pl-20">
            <h3 className={`text-3xl md:text-4xl font-black uppercase italic tracking-tighter ${themeTextMain} mb-6`}>
              TQ-HPR50 Drive Unit
            </h3>
            <p className={`text-sm md:text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md leading-relaxed`}>
              The Harmonic Pin Ring Transmission (HPR) is engineered for elite performance, delivering ultra-compact power, precision torque, and aerospace-grade efficiency. Designed for seamless integration into high-performance e-bike platforms, it provides an incredibly natural ride feel with near-silent operation and zero mechanical drag. Its precision-machined harmonic gearing system ensures consistent power transfer across varying terrain, while maintaining minimal weight and maximum durability.
            </p>
          </div>
        </div>
      </div>

      <div id="inventory" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        
        <div className="sticky top-4 md:top-24 z-[50] mb-8 md:mb-16 space-y-6">
          <div className={`${darkMode ? 'bg-[#111216]/80' : 'bg-white/80'} backdrop-blur-2xl border ${darkMode ? 'border-white/5' : 'border-black/10'} p-3 md:p-4 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row gap-4 items-center`}>
            <div className="relative w-full lg:w-96 group">
              <input
                type="text"
                placeholder="SEARCH PRODUCTS..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full ${themeInput} rounded-xl md:rounded-2xl py-3 md:py-4 px-6 pl-12 md:pl-14 text-[10px] md:text-xs focus:outline-none focus:border-orange-600 transition-all font-black tracking-widest placeholder:text-gray-500`}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex gap-2 overflow-x-auto w-full no-scrollbar pb-2 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 md:px-8 md:py-4 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase transition-all whitespace-nowrap border ${
                    activeCategory === cat
                      ? 'bg-orange-600 border-orange-600 text-white shadow-lg'
                      : `${darkMode ? 'bg-black border-white/5 text-gray-600 hover:text-white' : 'bg-gray-200 border-gray-300 text-gray-700 hover:bg-black hover:text-white'}`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-6" />
            <p className={`font-black uppercase tracking-[0.4em] ${themeTextSub} text-[10px] md:text-xs`}>Syncing Products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-x-6 md:gap-y-12">
            {filteredProducts.map(product => {
              const isOutOfStock = product.stock <= 0;
              return (
                <div key={product.id} className={`group relative ${isOutOfStock ? 'opacity-70' : ''}`}>
                  <div className={`${themeCard} rounded-[1.5rem] md:rounded-[3rem] border overflow-hidden transition-all duration-500 ${isOutOfStock ? 'border-red-900/20' : 'group-hover:border-orange-600/50 group-hover:-translate-y-1'}`}>
                    <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-white">
                      <img src={product.image_url} alt={product.name} className={`w-full h-full object-contain object-center ${isOutOfStock ? 'grayscale opacity-30' : ''}`} />
                      
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="border-2 border-red-600 text-red-600 px-3 py-1 text-[8px] md:text-[10px] font-black uppercase italic -rotate-12 tracking-[0.1em] bg-black/60 backdrop-blur-sm">Sold Out</span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3 md:top-6 md:left-6">
                        <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 md:px-4 md:py-2 rounded-full ${isOutOfStock ? 'bg-gray-800 text-gray-500' : 'bg-orange-600 text-white'}`}>
                          {product.category}
                        </span>
                      </div>
                    </Link>

                    <div className="p-4 md:p-8">
                      <Link to={`/product/${product.id}`}>
                        <h3 className={`text-xs md:text-base font-black italic uppercase tracking-tight mb-1 transition truncate ${isOutOfStock ? 'text-gray-600' : `${themeTextMain} group-hover:text-orange-600`}`}>
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-3 md:mb-4">
                        <p className={`text-base md:text-2xl font-black italic tracking-tight ${isOutOfStock ? 'text-gray-700' : `${darkMode ? 'text-white/90' : 'text-gray-900'}`}`}>
                          ₱{product.price.toLocaleString()}
                        </p>
                        {isAdmin && (
                          <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest mt-1 md:mt-0 ${product.stock <= 5 ? 'text-orange-600 animate-pulse' : themeTextSub}`}>
                            STOCK: {product.stock}
                          </span>
                        )}
                      </div>

                      <p className={`text-[10px] md:text-xs leading-relaxed ${themeTextSub} mb-4 md:mb-6 min-h-[32px] md:min-h-[38px] overflow-hidden`}>
                        {product.description || 'No description available.'}
                      </p>

                      <Link to={`/product/${product.id}`} className={`w-full py-3 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[8px] md:text-[10px] transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isOutOfStock ? 'bg-gray-900 text-gray-700 pointer-events-none' : `${darkMode ? 'bg-white text-black' : 'bg-black text-white'} hover:bg-orange-600 hover:text-white`}`}>
                        {isOutOfStock ? (
                          'OUT OF STOCK'
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Details
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-20 md:py-32 ${darkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]'} rounded-[2rem] md:rounded-[4rem] border border-dashed ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
            <h2 className={`font-black italic uppercase ${themeTextSub} tracking-tighter text-2xl md:text-4xl mb-4`}>No Intel Found.</h2>
            <button onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); }} className="text-orange-600 font-black uppercase text-[10px] tracking-widest hover:underline">Clear All Signals</button>
          </div>
        )}
      </div>

      <footer className={`py-10 md:py-20 border-t ${darkMode ? 'border-white/5' : 'border-black/5'} text-center`}>
        <p className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.5em] md:tracking-[1em] ${darkMode ? 'text-gray-800' : 'text-gray-400'}`}>
          PedalStreet Tactical Hub • 2024 Deployment
        </p>
      </footer>
    </div>
  );
}
