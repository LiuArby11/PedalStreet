import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

export default function Home({ isAdmin, session }) { 
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const userName = session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (activeCategory !== 'ALL') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [searchQuery, activeCategory, products]);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
    setFilteredProducts(data || []);
    setLoading(false);
  }

  const categories = ['ALL', 'ROAD', 'MTB', 'PARTS', 'GEAR'];

  return (
    <div className="bg-[#0a0b0d] min-h-screen">
      
      
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden border-b border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-orange-600/20 blur-[150px] rounded-full animate-pulse" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-orange-600 rounded-full animate-ping" />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
              {isAdmin ? 'System Bossing is Online' : 'PedalStreet E-Commerce Active'}
            </p>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter text-white leading-[0.85] mb-8">
            PEDAL<span className="text-orange-600">STREET.</span><br />
            <span className="text-3xl md:text-5xl text-gray-600 font-bold tracking-[-0.05em]">PUSH BEYOND LIMITS</span>
          </h1>

          <p className="max-w-xl mx-auto text-gray-500 font-medium text-sm md:text-base mb-10 tracking-tight">
            Welcome back, <span className="text-white font-black italic uppercase">{userName}</span>. 
            Your premium tactical cycling gear is ready, Buy now!.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a href="#inventory" className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 shadow-2xl">
              Shop Now
            </a>
          </div>
        </div>
      </section>

      <div id="inventory" className="max-w-7xl mx-auto px-6 py-20">
        
        
        <div className="sticky top-24 z-[50] mb-16 space-y-6">
          <div className="bg-[#111216]/80 backdrop-blur-2xl border border-white/5 p-4 rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative w-full lg:w-96 group">
              <input 
                type="text" 
                placeholder="SEARCH PRODUCTS..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-white/5 rounded-2xl py-4 px-6 pl-14 text-xs focus:outline-none focus:border-orange-600 transition-all font-black tracking-widest text-white placeholder:text-gray-700"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within:text-orange-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex gap-2 overflow-x-auto w-full no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-8 py-4 rounded-xl text-[9px] font-black tracking-[0.3em] uppercase transition-all whitespace-nowrap border ${
                    activeCategory === cat 
                    ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/40' 
                    : 'bg-black border-white/5 text-gray-600 hover:text-white hover:border-white/20'
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
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-6" />
            <p className="font-black uppercase tracking-[0.5em] text-gray-700 text-xs">Syncing Products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              
              return (
                <div key={product.id} className={`group relative ${isOutOfStock ? 'opacity-70' : ''}`}>
                  <div className={`bg-[#111216] rounded-[3rem] border overflow-hidden transition-all duration-500 shadow-2xl ${isOutOfStock ? 'border-red-900/20' : 'border-white/5 group-hover:border-orange-600/50'}`}>
                    
                    <Link to={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-black">
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className={`w-full h-full object-cover transition-transform duration-700 ${isOutOfStock ? 'grayscale opacity-30' : 'group-hover:scale-110'}`} 
                      />
                      
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="border-2 border-red-600 text-red-600 px-4 py-1 text-[10px] font-black uppercase italic -rotate-12 tracking-[0.2em] bg-black/60 backdrop-blur-sm">
                            Sold Out
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="absolute top-6 left-6">
                         <span className={`text-[8px] font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full shadow-xl ${isOutOfStock ? 'bg-gray-800 text-gray-500' : 'bg-orange-600 text-white'}`}>
                          {product.category}
                        </span>
                      </div>
                    </Link>

                    <div className="p-8">
                      <Link to={`/product/${product.id}`}>
                        <h3 className={`text-xl font-black italic uppercase tracking-tighter mb-2 transition truncate ${isOutOfStock ? 'text-gray-600' : 'text-white group-hover:text-orange-600'}`}>
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex justify-between items-end mb-8">
                        <p className={`text-3xl font-black italic tracking-tighter ${isOutOfStock ? 'text-gray-700' : 'text-white/90'}`}>
                          ₱{product.price.toLocaleString()}
                        </p>
                        {isAdmin && (
                          <span className={`text-[8px] font-black uppercase tracking-widest ${product.stock <= 5 ? 'text-orange-600 animate-pulse' : 'text-gray-600'}`}>
                            STOCK: {product.stock}
                          </span>
                        )}
                      </div>

                      
                      <Link 
                        to={`/product/${product.id}`}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 ${
                          isOutOfStock 
                          ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-white/5 pointer-events-none' 
                          : 'bg-white text-black hover:bg-orange-600 hover:text-white'
                        }`}
                      >
                        {isOutOfStock ? (
                          'OUT OF STOCK'
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
          <div className="text-center py-32 bg-white/[0.02] rounded-[4rem] border border-dashed border-white/10">
            <h2 className="font-black italic uppercase text-gray-700 tracking-tighter text-4xl mb-4">No Intel Found.</h2>
            <button onClick={() => {setSearchQuery(''); setActiveCategory('ALL');}} className="text-orange-600 font-black uppercase text-[10px] tracking-widest hover:underline transition-all">
              Clear All Signals
            </button>
          </div>
        )}
      </div>

      <footer className="py-20 border-t border-white/5 text-center">
        <p className="text-[8px] font-black uppercase tracking-[1em] text-gray-800">
          PedalStreet Tactical Hub &bull; 2024 Deployment
        </p>
      </footer>
    </div>
  );
}