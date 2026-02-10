import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProductDetails({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  
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
        if (mainProduct.options?.sizes) setSelectedSize(mainProduct.options.sizes[0]);
        if (mainProduct.options?.colors) setSelectedColor(mainProduct.options.colors[0]);

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

  const increaseQty = () => {
    if (quantity < product.stock) setQuantity(prev => prev + 1);
  };
  const decreaseQty = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleAddToCart = () => {
  if (product.stock <= 0) {
    alert("🚨 LOGISTICS ERROR: Out of stock.");
    return;
  }
  
  const productWithVariants = { 
    ...product, 
    selectedSize, 
    selectedColor, 
    quantity: Number(quantity) // Siguraduhin na Number ito
  };
  
  addToCart(productWithVariants);
  alert(`Deployed ${quantity} unit(s) to Stash: ${product.name}`);
};

  // NEW: Logic para sa Buy Now (Shortcut to Checkout - Bypasses Global Cart)
  const handleBuyNow = () => {
    if (product.stock <= 0) {
      alert("🚨 LOGISTICS ERROR: Out of stock.");
      return;
    }
    
    // Gagawa tayo ng object na bitbit lahat ng choices ng user (size, color, qty)
    const directBuyItem = { 
      ...product, 
      selectedSize, 
      selectedColor, 
      quantity 
    };

    // Imbis na addToCart, ipapasa natin ito via navigate state
    // Parang "Express Lane" ito na hindi dadaan sa main Stash/Cart
    navigate('/checkout', { state: { directBuyItem } });
  };

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

  const isOutOfStock = product.stock <= 0;

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
          {/* Image Section */}
          <div className="lg:col-span-7 relative group">
            <div className="relative overflow-hidden rounded-[4rem] border border-white/5 bg-[#111216] shadow-2xl">
              <img 
                src={product.image_url} 
                alt={product.name} 
                className={`w-full h-[700px] object-cover transform group-hover:scale-110 transition-transform duration-[2s] ease-out ${isOutOfStock ? 'grayscale opacity-40' : ''}`} 
              />
              <div className="absolute bottom-10 left-10 flex gap-4">
                <div className={`backdrop-blur-xl border px-6 py-3 rounded-2xl flex items-center gap-3 ${isOutOfStock ? 'bg-red-600/20 border-red-600/50' : 'bg-black/40 border-white/10'}`}>
                  <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-600' : 'bg-green-500 animate-pulse'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white italic">
                    {isOutOfStock ? 'Depleted' : `Stock: ${product.stock} Units`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-5 flex flex-col pt-10 sticky top-32">
            <div className="inline-block bg-orange-600/10 border border-orange-600/20 px-4 py-1.5 rounded-full mb-6 w-fit">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-600 italic">
                {product.category} // Tactical Gear
              </p>
            </div>

            <h1 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.8] text-white mb-8">
              {product.name}<span className="text-orange-600">.</span>
            </h1>

            <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/5">
              <span className="text-6xl font-black italic text-white tracking-tighter">
                ₱{product.price.toLocaleString()}
              </span>
            </div>

            <div className="space-y-8 mb-12">
              {/* QUANTITY */}
              {!isOutOfStock && (
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 italic">Payload Quantity</p>
                  <div className="flex items-center gap-4 bg-white/[0.02] border border-white/10 w-fit rounded-2xl p-2">
                    <button onClick={decreaseQty} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/5 text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M20 12H4" /></svg>
                    </button>
                    <span className="text-lg font-black text-white w-12 text-center">{quantity}</span>
                    <button onClick={increaseQty} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-orange-600 bg-white/5 text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* SIZES */}
              {product.options?.sizes && (
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 italic">Frame Size</p>
                  <div className="flex flex-wrap gap-3">
                    {product.options.sizes.map((size) => (
                      <button key={size} onClick={() => setSelectedSize(size)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedSize === size ? "bg-orange-600 border-orange-600 text-white" : "bg-white/[0.02] border-white/10 text-gray-400"}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* COLORS */}
              {product.options?.colors && (
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 italic">Skin Variant</p>
                  <div className="flex flex-wrap gap-3">
                    {product.options.colors.map((color) => (
                      <button key={color} onClick={() => setSelectedColor(color)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedColor === color ? "bg-white text-black border-white" : "bg-white/[0.02] border-white/10 text-gray-400"}`}>
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-4">
              {/* BUY NOW - PRIMARY */}
              <button 
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className={`group relative w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs transition-all transform active:scale-95 overflow-hidden ${isOutOfStock ? 'bg-gray-900 text-gray-600 cursor-not-allowed' : 'bg-orange-600 text-white shadow-[0_20px_40px_rgba(234,88,12,0.3)]'}`}
              >
                <span className="relative z-10">{isOutOfStock ? 'UNAVAILABLE' : 'Initialize Buy Now ⚡'}</span>
                {!isOutOfStock && <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 mix-blend-difference" />}
              </button>

              {/* ADD TO CART - SECONDARY */}
              <button 
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] transition-all border ${isOutOfStock ? 'border-white/5 text-gray-700' : 'border-white/10 text-white hover:bg-white hover:text-black'}`}
              >
                Add to Stash Manifest
              </button>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-white/5 pt-24">
            <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-16">Matching <span className="text-orange-600">Manifest.</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="group">
                  <div className="bg-[#111216] border border-white/5 rounded-[2.5rem] p-4 group-hover:border-orange-600/30 transition-all duration-500 overflow-hidden relative">
                    <div className="aspect-square overflow-hidden rounded-[1.8rem] mb-6">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" />
                    </div>
                    <div className="px-2 pb-2">
                      <h3 className="text-sm font-black italic uppercase tracking-tight text-white group-hover:text-orange-600 truncate mb-1">{item.name}</h3>
                      <p className="text-orange-600 font-black italic text-lg tracking-tighter">₱{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}