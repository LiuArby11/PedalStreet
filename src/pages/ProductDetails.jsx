import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      setLoading(true);
      const { data: mainProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (mainProduct) {
        setProduct(mainProduct);
        const { data: related } = await supabase
          .from('products')
          .select('*')
          .eq('category', mainProduct.category)
          .neq('id', id)
          .limit(4);
        
        setRelatedProducts(related || []);
      }
      setLoading(false);
    };

    fetchProductAndRelated();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] bg-black">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-orange-600/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-8 font-black uppercase tracking-[0.5em] text-orange-600 text-[10px] animate-pulse">Scanning Blueprint...</p>
    </div>
  );

  if (!product) return <div className="text-center mt-20 font-black uppercase text-white">Target Not Found.</div>;

  return (
    <div className="bg-[#0a0b0d] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        
        <button 
          onClick={() => navigate(-1)} 
          className="group mb-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-orange-600 transition-all"
        >
          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:border-orange-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          Back to Inventory
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start mb-32">
          
          
          <div className="lg:col-span-7 relative group">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-600/10 blur-[80px] rounded-full"></div>
            <div className="relative overflow-hidden rounded-[4rem] border border-white/5 bg-[#111216] shadow-2xl">
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-[700px] object-cover transform group-hover:scale-110 transition-transform duration-[2s] ease-out shadow-inner" 
              />
              
              
              <div className="absolute bottom-10 left-10 flex gap-4">
                <div className="backdrop-blur-xl bg-black/40 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white italic">Live Stock Available</span>
                </div>
              </div>
            </div>
          </div>

          
          <div className="lg:col-span-5 flex flex-col pt-10 sticky top-32">
            <div className="inline-block bg-orange-600/10 border border-orange-600/20 px-4 py-1.5 rounded-full mb-6 w-fit">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-600 italic">
                {product.category} // Grade A Tactical
              </p>
            </div>

            <h1 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] text-white mb-8">
              {product.name}<span className="text-orange-600">.</span>
            </h1>

            <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/5">
              <span className="text-6xl font-black italic text-white tracking-tighter">
                ₱{product.price.toLocaleString()}
              </span>
              <div className="h-10 w-[2px] bg-white/5 rotate-[20deg]"></div>
              <div>
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Shipping Protocol</p>
                <p className="text-[10px] font-bold text-green-500 uppercase italic">Free Logistics Included</p>
              </div>
            </div>

            <div className="space-y-6 mb-12">
              <p className="text-gray-400 text-lg leading-relaxed font-medium italic">
                "{product.description}"
              </p>
              
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Durability</p>
                  <p className="text-xs font-black text-white italic">PRO_SPEC_800</p>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Weight Class</p>
                  <p className="text-xs font-black text-white italic">ULTRALIGHT_X</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => addToCart(product)}
                className="group relative w-full bg-white text-black py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.05)] overflow-hidden"
              >
                <span className="relative z-10">Deploy to Stash ⚡</span>
                <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </div>

            <div className="mt-8 flex items-center justify-between px-4">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0b0d] bg-gray-800 flex items-center justify-center">
                     <div className="w-full h-full rounded-full bg-gradient-to-tr from-orange-600 to-orange-400 opacity-80" />
                  </div>
                ))}
              </div>
              <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest italic">+120 Riders currently eyeing this gear</p>
            </div>
          </div>
        </div>

        
        {relatedProducts.length > 0 && (
          <div className="border-t border-white/5 pt-24">
            <div className="flex flex-col md:flex-row justify-between items-baseline mb-16">
              <div>
                <p className="text-orange-600 font-black uppercase text-[10px] tracking-[0.5em] mb-4 italic underline underline-offset-8">Complementary Units</p>
                <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Matching <span className="text-orange-600">Manifest.</span></h2>
              </div>
              <Link to="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white mt-4 md:mt-0 transition-colors">View All Inventory &rarr;</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/product/${item.id}`} 
                  className="group"
                >
                  <div className="bg-[#111216] border border-white/5 rounded-[2.5rem] p-4 group-hover:border-orange-600/30 transition-all duration-500 overflow-hidden">
                    <div className="aspect-square overflow-hidden rounded-[1.8rem] mb-6 relative">
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" 
                      />
                    </div>
                    <div className="px-2 pb-2">
                      <h3 className="text-sm font-black italic uppercase tracking-tight text-white group-hover:text-orange-600 transition truncate mb-1">
                        {item.name}
                      </h3>
                      <p className="text-orange-600 font-black italic text-lg tracking-tighter">₱{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" 
           style={{backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`, backgroundSize: '40px 40px'}}></div>
    </div>
  );
}