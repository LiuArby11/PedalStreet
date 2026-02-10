// App.js
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
// --- DAGDAG: Import ang bagong UpdatePassword page ---
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
        console.error("STASH_ERROR: Data corruption detected.");
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
      console.error("Error fetching profile:", err.message);
    }
  };

  const addToCart = (product) => {
    if (isAdmin) {
      alert("ADMIN_NOTICE: Overlords cannot acquire gear.");
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
          alert(`🚨 STOCK_LIMIT: Only ${product.stock} units available.`);
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
        
        <nav className="sticky top-0 z-[100] bg-[#0a0b0d]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            
            <Link to="/" className="flex items-center gap-2 group cursor-pointer relative z-[110]">
              <div className="bg-orange-600 p-2 rounded-xl rotate-12 group-hover:rotate-0 transition-transform shadow-lg shadow-orange-600/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-black italic tracking-tighter uppercase">
                Pedal<span className="text-orange-600">Street.</span>
              </span>
            </Link>

            <div className="flex items-center gap-6">
              {session ? (
                <>
                  <div className="hidden md:block text-right mr-2">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Rider Status</p>
                    <p className="text-xs font-black text-white italic uppercase tracking-tight">
                      {isAdmin ? '🛡️ Overlord' : `⚡ ${userProfile?.first_name || 'Rider'}`}
                    </p>
                  </div>
                  
                  {!isAdmin && (
                    <Link to="/orders" className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-orange-600 transition">
                      Mission Log
                    </Link>
                  )}

                  {isAdmin && (
                    <Link to="/admin" className="text-[9px] font-black uppercase tracking-widest bg-white text-black px-5 py-2.5 rounded-full hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 shadow-xl">
                      Inventory Control
                    </Link>
                  )}

                  {!isAdmin && (
                    <Link to="/cart" className="relative group bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-orange-600/50 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 118 0m-4 4v2m0 0l-4-4m4 4l4-4" />
                      </svg>
                      {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-orange-600 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0a0b0d]">
                          {cart.reduce((a, b) => a + b.quantity, 0)}
                        </span>
                      )}
                    </Link>
                  )}

                  <button onClick={handleLogout} className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition border-l border-white/10 pl-6">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-white text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white transition transform active:scale-95">
                  Sign In
                </Link>
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
            
            {/* DAGDAG: Route para sa Password Update */}
            <Route path="/update-password" element={<UpdatePassword />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}