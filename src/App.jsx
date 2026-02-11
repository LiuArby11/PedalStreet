import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Orders from './pages/Orders'; 
import ProductDetails from './pages/ProductDetails';
import OrderSuccess from './pages/OrderSuccess';
import UpdatePassword from './pages/UpdatePassword'; 

export default function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null); 

  const [cart, setCart] = useState(() => {
    const savedStash = localStorage.getItem('pedal_street_cart');
    if (savedStash) {
      try {
        return JSON.parse(savedStash);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('pedal_street_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkUserRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserRole(session.user.id);
      } else {
        setIsAdmin(false);
        setUserProfile(null);
        setCart([]); 
        localStorage.removeItem('pedal_street_cart');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, first_name, username')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setIsAdmin(data.is_admin === true);
        setUserProfile(data);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const addToCart = (product) => {
    if (isAdmin) {
      alert("ADMIN NOTICE: Overlords cannot acquire gear.");
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.id === product.id &&
          item.selectedSize === product.selectedSize &&
          item.selectedColor === product.selectedColor
      );

      if (existingIndex > -1) {
        const newCart = [...prev];
        const newQty = newCart[existingIndex].quantity + (product.quantity || 1);
        
        if (newQty > product.stock) {
          alert(` STOCK LIMIT: Only ${product.stock} units available.`);
          return prev;
        }
        
        newCart[existingIndex].quantity = newQty;
        return newCart;
      }

      return [...prev, { ...product }];
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; 
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0b0d] text-white font-sans selection:bg-orange-600 selection:text-white">
        
        <nav className="sticky top-0 z-[100] bg-[#0a0b0d]/80 backdrop-blur-2xl border-b border-white/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            
            <Link to="/" className="flex items-center gap-3 group relative z-[110]">
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-2.5 rounded-xl rotate-12 group-hover:rotate-0 transition-all duration-500 shadow-[0_0_20px_rgba(234,88,12,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-black italic tracking-tighter uppercase flex flex-col leading-none">
                PEDAL<span className="text-orange-600 -mt-1">STREET.</span>
              </span>
            </Link>

            <div className="flex items-center gap-4 lg:gap-8">
              {session ? (
                <>
                  <div className="hidden lg:flex flex-col items-end border-r border-white/10 pr-6">
                    <span className="text-[9px] font-black text-orange-600 uppercase tracking-[0.3em] mb-0.5">Status: Online</span>
                    <span className="text-xs font-black text-white italic uppercase tracking-tight">
                      {isAdmin ? 'Master' : `${userProfile?.first_name || 'User'}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 lg:gap-4">
                    {!isAdmin && (
                      <Link to="/orders" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
                        Orders
                      </Link>
                    )}

                    {isAdmin && (
                      <Link to="/admin" className="text-[10px] font-black uppercase tracking-widest bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-white hover:text-black transition-all transform active:scale-95 shadow-lg shadow-orange-600/20">
                        PRODUCT AND ORDER MANAGEMENT
                      </Link>
                    )}

                    {!isAdmin && (
                      <Link to="/cart" className="relative group bg-white/[0.03] p-3.5 rounded-xl border border-white/5 hover:border-orange-600/50 hover:bg-orange-600/5 transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {cart.length > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0a0b0d] animate-in zoom-in">
                            {cart.reduce((a, b) => a + b.quantity, 0)}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>

                  <button 
                    onClick={handleLogout} 
                    className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-all border-l border-white/10 pl-4 lg:pl-8 ml-2"
                  >
                    <span>Logout</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="relative overflow-hidden bg-white text-black px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all transform active:scale-95 group">
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Home isAdmin={isAdmin} session={session} userProfile={userProfile} />} />
            <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
            <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" />} />
            <Route path="/cart" element={session ? <Cart cart={cart} setCart={setCart} /> : <Navigate to="/login" />} />
            <Route path="/checkout" element={session ? <Checkout cart={cart} setCart={setCart} session={session} /> : <Navigate to="/login" />} />
            <Route path="/orders" element={session ? <Orders /> : <Navigate to="/login" />} />
            <Route path="/order-success" element={session ? <OrderSuccess /> : <Navigate to="/login" />} />
            <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} />} />
            <Route path="/admin" element={isAdmin ? <Admin /> : <Navigate to="/" />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}