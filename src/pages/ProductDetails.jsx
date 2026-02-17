import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProductDetails({ addToCart, darkMode, session, isAdmin }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [variantRows, setVariantRows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [modal, setModal] = useState({
    open: false,
    type: "info",
    title: "",
    message: "",
    redirectTo: null // Dagdag para sa auto-redirect pag-close ng modal
  });

  const showModal = (type, title, message, redirectTo = null) => {
    setModal({ open: true, type, title, message, redirectTo });
  };

  const closeModal = () => {
    if (modal.redirectTo) {
      navigate(modal.redirectTo);
    }
    setModal({ ...modal, open: false, redirectTo: null });
  };

  const navigate = useNavigate();

  const isDark = darkMode === true;
  const themeBgMain = isDark ? 'bg-[#0a0b0d]' : 'bg-[#f4f4f7]';
  const themeTextMain = isDark ? 'text-white' : 'text-gray-900';
  const themeTextSub = isDark ? 'text-gray-500' : 'text-gray-600';
  const themeModal = isDark ? 'bg-[#0d0e12] border-white/10' : 'bg-white border-gray-200';
  const themeBtnSecondary = isDark ? 'border-white/10 text-white hover:bg-white hover:text-black' : 'border-black/10 text-black hover:bg-black hover:text-white';
  const trustSignals = [
    { label: 'Secure Checkout', tone: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { label: 'Fast Dispatch', tone: 'text-green-500 bg-green-500/10 border-green-500/20' },
    { label: 'Verified Product', tone: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  ];
  const hasVariantStock = variantRows.length > 0;

  const sizeOptions = hasVariantStock
    ? [...new Set(variantRows.map((v) => v.size).filter(Boolean))]
    : (product?.options?.sizes || []);

  const colorOptions = hasVariantStock
    ? [...new Set(
        variantRows
          .filter((v) => !selectedSize || (v.size || '') === selectedSize)
          .map((v) => v.color)
          .filter(Boolean)
      )]
    : (product?.options?.colors || []);

  const selectedVariantStock = hasVariantStock
    ? Number(
        variantRows.find(
          (v) =>
            (v.size || '') === (selectedSize || '') &&
            (v.color || '') === (selectedColor || '')
        )?.stock || 0
      )
    : Number(product?.stock || 0);
  const isLowVariantStock = selectedVariantStock > 0 && selectedVariantStock <= 2;

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      setLoading(true);
      setQuantity(1); 

      const { data: mainProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (mainProduct && !mainProduct.is_archived) {
        setProduct(mainProduct);

        let variantData = [];
        try {
          const { data: variants, error: variantError } = await supabase
            .from('product_variant_stocks')
            .select('size, color, stock')
            .eq('product_id', mainProduct.id)
            .order('size', { ascending: true })
            .order('color', { ascending: true });

          if (!variantError) {
            variantData = variants || [];
          }
        } catch {
          variantData = [];
        }

        setVariantRows(variantData);

        if (variantData.length > 0) {
          const firstVariant = variantData.find((v) => Number(v.stock) > 0) || variantData[0];
          setSelectedSize(firstVariant?.size || '');
          setSelectedColor(firstVariant?.color || '');
        } else {
          if (mainProduct.options?.sizes) setSelectedSize(mainProduct.options.sizes[0]);
          else setSelectedSize('');
          if (mainProduct.options?.colors) setSelectedColor(mainProduct.options.colors[0]);
          else setSelectedColor('');
        }

        const { data: related } = await supabase
          .from('products')
          .select('*')
          .eq('category', mainProduct.category)
          .neq('id', id)
          .limit(4);
        
        setRelatedProducts((related || []).filter((item) => !item.is_archived));
      } else {
        setProduct(null);
        setRelatedProducts([]);
        setVariantRows([]);
      }
      setLoading(false);
    };

    fetchProductAndRelated();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]); 

  const safeQuantity = Math.max(1, Math.min(quantity, Math.max(1, selectedVariantStock)));

  const increaseQty = () => {
    if (safeQuantity < selectedVariantStock) setQuantity(safeQuantity + 1);
  };
  const decreaseQty = () => {
    if (safeQuantity > 1) setQuantity(safeQuantity - 1);
  };

  const handleAddToCart = () => {
    if (!session) {
      showModal("info", "AUTH REQUIRED", "Please login to synchronize your cart with our servers.", "/login");
      return;
    }
    if (isAdmin) {
      showModal("error", "ACCESS DENIED", "Admin accounts cannot add products to cart.");
      return;
    }

    if (selectedVariantStock <= 0) {
      showModal("error", "LOGISTICS ERROR", "Out of stock.");
      return;
    }
    const productWithVariants = { 
      ...product, 
      stock: selectedVariantStock,
      selectedSize, 
      selectedColor, 
      quantity: Number(safeQuantity) 
    };
    addToCart(productWithVariants);
    showModal("success", "DEPLOYED TO CART", `Deployed ${safeQuantity} unit(s) to Cart: ${product.name}`);
  };

  const handleBuyNow = () => {
    // 1. Auth Check with Modal
    if (!session) {
      showModal("info", "AUTH REQUIRED", "Secure authentication is required before proceeding to checkout.", "/login");
      return;
    }
    if (isAdmin) {
      showModal("error", "ACCESS DENIED", "Admin accounts cannot place customer orders.");
      return;
    }

    if (selectedVariantStock <= 0) {
      showModal("error", "LOGISTICS ERROR", "Out of stock.");
      return;
    }
    const directBuyItem = { 
      ...product, 
      stock: selectedVariantStock,
      selectedSize, 
      selectedColor, 
      quantity: safeQuantity 
    };
    navigate('/checkout', { state: { directBuyItem } });
  };

  if (loading) return (
    <div className={`flex flex-col items-center justify-center h-[80vh] ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        <div className={`absolute inset-0 border-4 ${isDark ? 'border-orange-600/20' : 'border-gray-200'} rounded-full`}></div>
        <div className="absolute inset-0 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-8 font-black uppercase tracking-[0.5em] text-orange-600 text-[8px] md:text-[10px] animate-pulse">Synchronizing Data...</p>
    </div>
  );

  if (!product) return <div className={`text-center mt-20 font-black uppercase ${themeTextMain}`}>Product Not Found.</div>;

  const isOutOfStock = selectedVariantStock <= 0;

  return (
    <div className={`${themeBgMain} min-h-screen transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 pb-28 md:pb-16">
        
        <button 
          onClick={() => navigate('/')} 
          className={`group mb-8 md:mb-12 flex items-center gap-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] ${themeTextSub} hover:text-orange-600 transition-all`}
        >
          <div className={`w-8 h-8 rounded-full border ${isDark ? 'border-white/5' : 'border-black/5'} flex items-center justify-center group-hover:border-orange-600 transition-colors`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          Back to Shopping
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mb-20 md:mb-32">
          
          <div className="lg:col-span-7 relative group">
            <div className={`relative overflow-hidden rounded-[2.5rem] md:rounded-[4rem] border ${isDark ? 'border-white/5' : 'border-black/5'} bg-white shadow-2xl`}>
              <img 
                src={product.image_url} 
                alt={product.name} 
                className={`w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] object-contain object-center ${isOutOfStock ? 'grayscale opacity-40' : ''}`} 
              />
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex gap-4">
                <div className={`backdrop-blur-xl border px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-3 ${isOutOfStock ? 'bg-red-600/20 border-red-600/50' : 'bg-black/40 border-white/10'}`}>
                  <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-600' : 'bg-green-500 animate-pulse'}`}></div>
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white italic">
                    {isOutOfStock ? 'Out of stock' : `Stock: ${selectedVariantStock}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col pt-0 lg:pt-10 lg:sticky lg:top-32">
            <div className="inline-block bg-orange-600/10 border border-orange-600/20 px-4 py-1.5 rounded-full mb-4 md:mb-6 w-fit">
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-orange-600 italic">
                {product.category} 
              </p>
            </div>

            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black italic uppercase tracking-tighter leading-[0.9] ${themeTextMain} mb-5 md:mb-6`}>
              {product.name}<span className="text-orange-600">.</span>
            </h1>

            <div className={`flex items-center gap-6 mb-7 md:mb-8 pb-7 md:pb-8 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <span className={`text-2xl md:text-4xl font-black italic ${themeTextMain} tracking-tight`}>
                ₱{product.price.toLocaleString()}
              </span>
            </div>

            {!!String(product.description || '').trim() && (
              <div className={`mb-8 md:mb-10 pb-8 md:pb-10 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <p className={`text-[9px] md:text-[10px] font-black ${themeTextSub} uppercase tracking-[0.3em] mb-3 italic`}>
                  Description
                </p>
                <p className={`text-sm md:text-base leading-relaxed font-medium ${themeTextSub}`}>
                  {product.description}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 md:gap-3 mb-8">
              {trustSignals.map((signal) => (
                <span key={signal.label} className={`px-4 py-2 rounded-full border text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${signal.tone}`}>
                  {signal.label}
                </span>
              ))}
            </div>

            {isLowVariantStock && (
              <div className="mb-8 px-4 py-3 rounded-xl border bg-red-600/10 border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">
                Only {selectedVariantStock} left for this variant. Secure it now.
              </div>
            )}

            <div className="space-y-6 md:space-y-8 mb-10 md:mb-12">
              {!isOutOfStock && (
                <div>
                  <p className={`text-[9px] md:text-[10px] font-black ${themeTextSub} uppercase tracking-[0.3em] mb-4 italic`}>Quantity</p>
                  <div className={`flex items-center gap-4 ${isDark ? 'bg-white/[0.02]' : 'bg-gray-100'} border ${isDark ? 'border-white/10' : 'border-black/5'} w-fit rounded-2xl p-1.5`}>
                    <button onClick={decreaseQty} className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl hover:bg-white/5 ${themeTextMain} transition-colors`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M20 12H4" /></svg>
                    </button>
                    <span className={`text-base md:text-lg font-black ${themeTextMain} w-8 md:w-12 text-center`}>{safeQuantity}</span>
                    <button onClick={increaseQty} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl hover:bg-orange-600 bg-orange-600/10 text-orange-600 hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                </div>
              )}

              {sizeOptions.length > 0 && (
                <div>
                  <p className={`text-[9px] md:text-[10px] font-black ${themeTextSub} uppercase tracking-[0.3em] mb-3 md:mb-4 italic`}>Frame Size</p>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSize(size);
                          if (hasVariantStock) {
                            const nextColors = [...new Set(
                              variantRows
                                .filter((v) => (v.size || '') === size)
                                .map((v) => v.color)
                                .filter(Boolean)
                            )];
                            if (nextColors.length > 0 && !nextColors.includes(selectedColor)) {
                              setSelectedColor(nextColors[0]);
                            }
                          }
                        }}
                        className={`px-4 py-2 md:px-6 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${selectedSize === size ? "bg-orange-600 border-orange-600 text-white" : `${isDark ? 'bg-white/[0.02] border-white/10 text-gray-400' : 'bg-white border-gray-200 text-gray-600'}`}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {colorOptions.length > 0 && (
                <div>
                  <p className={`text-[9px] md:text-[10px] font-black ${themeTextSub} uppercase tracking-[0.3em] mb-3 md:mb-4 italic`}>Skin Variant</p>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {colorOptions.map((color) => (
                      <button key={color} onClick={() => setSelectedColor(color)} className={`px-4 py-2 md:px-6 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${selectedColor === color ? `${isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'}` : `${isDark ? 'bg-white/[0.02] border-white/10 text-gray-400' : 'bg-white border-gray-200 text-gray-600'}`}`}>
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:gap-4">
              <button 
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className={`group relative w-full py-6 md:py-8 rounded-[1.5rem] md:rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] md:text-xs transition-all transform active:scale-95 overflow-hidden ${isOutOfStock ? 'bg-gray-900 text-gray-600 cursor-not-allowed' : 'bg-orange-600 text-white shadow-[0_20px_40px_rgba(234,88,12,0.3)]'}`}
              >
                <span className="relative z-10 group-hover:text-orange-600 transition-colors">
                  {isOutOfStock ? 'UNAVAILABLE' : 'BUY NOW'}
                </span>
                {!isOutOfStock && (
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </button>

              <button 
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`w-full py-5 md:py-6 rounded-[1.2rem] md:rounded-[2rem] font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] transition-all border ${isOutOfStock ? 'border-white/5 text-gray-700' : themeBtnSecondary}`}
              >
                Add to cart
              </button>
            </div>

            <div className={`mt-8 md:mt-10 p-5 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-black/10 bg-gray-50'}`}>
              <p className="text-[9px] font-black uppercase tracking-[0.35em] text-orange-600 mb-4">Rider Assurance</p>
              <div className="space-y-3">
                <p className={`text-[11px] font-bold ${themeTextSub}`}>Stock is reserved immediately on checkout to protect your order slot.</p>
                <p className={`text-[11px] font-bold ${themeTextSub}`}>If order is cancelled before delivery, stock is automatically returned.</p>
                <p className={`text-[11px] font-bold ${themeTextSub}`}>Full order status visibility: Processing, Shipped, Delivered.</p>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className={`border-t ${isDark ? 'border-white/5' : 'border-black/5'} pt-16 md:pt-24`}>
            <h2 className={`text-4xl md:text-6xl font-black italic uppercase tracking-tighter ${themeTextMain} mb-10 md:mb-16`}>Alternative <span className="text-orange-600">Intel.</span></h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {relatedProducts.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="group">
                  <div className={`${isDark ? 'bg-[#111216] border-white/5' : 'bg-white border-gray-200 shadow-md'} border rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-4 group-hover:border-orange-600/30 transition-all duration-500 overflow-hidden relative`}>
                    <div className="aspect-square overflow-hidden rounded-[1rem] md:rounded-[1.8rem] mb-4 md:mb-6 bg-white">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain object-center" />
                    </div>
                    <div className="px-1 md:px-2 pb-1 md:pb-2">
                      <h3 className={`text-[10px] md:text-sm font-black italic uppercase tracking-tight ${themeTextMain} group-hover:text-orange-600 truncate mb-1`}>{item.name}</h3>
                      <p className="text-orange-600 font-black italic text-sm md:text-base tracking-tight">₱{item.price.toLocaleString()}</p>
                      <p className={`text-[10px] md:text-xs ${themeTextSub} mt-1 leading-relaxed min-h-[28px] overflow-hidden`}>
                        {item.description || 'No description available.'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isOutOfStock && (
        <div className={`lg:hidden fixed bottom-3 left-3 right-3 z-40 ${isDark ? 'bg-[#0d0e12]/95 border-white/10' : 'bg-white/95 border-black/10'} border backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl`}>
          <div>
            <p className={`text-[8px] font-black uppercase tracking-[0.3em] ${themeTextSub}`}>Quick Checkout</p>
            <p className="text-lg font-black italic tracking-tight text-orange-600">₱{product.price.toLocaleString()}</p>
          </div>
          <button
            onClick={handleBuyNow}
            className="bg-orange-600 text-white px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] hover:bg-black transition-all"
          >
            Buy Now
          </button>
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-6">
          <div className={`${themeModal} border rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300`}>
            <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-[2.5rem] ${
              modal.type === "error" ? "bg-red-600" : "bg-orange-600"
            }`} />

            <h3 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tight mb-4 ${themeTextMain}`}>
              {modal.title}
            </h3>

            <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'} text-xs md:text-sm mb-8`}>
              {modal.message}
            </p>

            <button
              onClick={closeModal}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-orange-600/20"
            >
              CONFIRM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

