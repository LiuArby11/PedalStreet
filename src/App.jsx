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
import Profile from './pages/Profile';

export default function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState(null); 
  
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('pedal_street_theme');
    return savedTheme ? JSON.parse(savedTheme) : true;
  });

  useEffect(() => {
    localStorage.setItem('pedal_street_theme', JSON.stringify(darkMode));
  }, [darkMode]);

  const themeBg = darkMode ? 'bg-[#0a0b0d]' : 'bg-[#f4f4f7]';
  const themeNav = darkMode ? 'bg-[#0a0b0d]/90 border-white/[0.05]' : 'bg-white/90 border-gray-200';
  const themeText = darkMode ? 'text-white' : 'text-gray-900';

  const displayName =
    userProfile?.first_name ||
    session?.user?.email?.split('@')[0] ||
    'U';

  const userInitial = displayName.charAt(0).toUpperCase();

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

  const checkUserRole = async (user) => {
    if (!user || !user.id) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, first_name, username, phone')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setIsAdmin(data.is_admin);
      setUserProfile(data); 
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkUserRole(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserRole(session.user);
      } else {
        setIsAdmin(false);
        setUserProfile(null);
        setCart([]); 
        localStorage.removeItem('pedal_street_cart');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      <div className={`min-h-screen ${themeBg} ${themeText} font-sans selection:bg-orange-600 selection:text-white transition-colors duration-500`}>
        
        <nav className={`sticky top-0 z-[100] ${themeNav} backdrop-blur-2xl border-b shadow-2xl transition-colors`}>
          <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 lg:h-20 flex justify-between items-center">
            
            <Link to="/" className="flex items-center gap-2 lg:gap-3 group relative z-[110]">
              <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-1.5 lg:p-2.5 rounded-lg lg:rounded-xl rotate-12 group-hover:rotate-0 transition-all duration-500 shadow-lg shadow-orange-600/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-6 lg:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg lg:text-2xl font-black italic tracking-tighter uppercase flex flex-col leading-none">
                PEDAL<span className="text-orange-600 -mt-0.5 lg:-mt-1">STREET.</span>
              </span>
            </Link>

            <div className="flex items-center gap-2 lg:gap-8">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg border ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'} transition-all`}
                title="Toggle Theme"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {session ? (
                <>
                  <div className="flex items-center gap-1 lg:gap-4">
                    {!isAdmin && (
                      <Link to="/orders" className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'} p-2 lg:px-4 lg:py-2 transition-all rounded-lg lg:hover:bg-black/5`}>
                        <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Orders</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link to="/admin" className="bg-orange-600 text-white p-2 lg:px-6 lg:py-3 rounded-lg lg:rounded-xl hover:bg-white hover:text-black transition-all shadow-lg shadow-orange-600/20">
                        <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Dashboard</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        </svg>
                      </Link>
                    )}

                    {!isAdmin && (
                      <Link to="/cart" className={`relative p-2 ${darkMode ? 'bg-white/[0.03]' : 'bg-black/[0.03]'} rounded-lg border ${darkMode ? 'border-white/5' : 'border-black/5'} hover:border-orange-600/50 transition-all`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {cart.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-current">
                            {cart.reduce((a, b) => a + b.quantity, 0)}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>

                  <div className={`flex items-center gap-3 lg:gap-6 border-l ${darkMode ? 'border-white/10' : 'border-black/10'} pl-3 lg:pl-10 ml-1`}>
                    <Link to="/profile" className="group/profile flex items-center gap-2">
                      <div className="hidden lg:flex flex-col text-right">
                        <span className={`text-[10px] font-black uppercase ${themeText} leading-none mb-1`}>{displayName}</span>
                        <span className="text-[8px] font-bold uppercase text-orange-600">Verified</span>
                      </div>
                      <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-200'} border ${darkMode ? 'border-white/10' : 'border-black/10'} flex items-center justify-center text-xs lg:text-sm font-black ${themeText} group-hover/profile:border-orange-600 transition-all`}>
                        {userInitial}
                      </div>
                    </Link>

                    <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                      <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest mr-2">Logout</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login" className="bg-orange-600 text-white px-4 py-2 lg:px-10 lg:py-3.5 rounded-lg lg:rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Home isAdmin={isAdmin} session={session} userProfile={userProfile} darkMode={darkMode} />} />
            
            <Route path="/login"  element={!session ? <Login darkMode={darkMode} /> : <Navigate to="/" />} />
            <Route path="/signup" element={!session ? <Signup darkMode={darkMode} /> : <Navigate to="/" />} />
            
            <Route path="/cart" element={session ? <Cart cart={cart} setCart={setCart} darkMode={darkMode} /> : <Navigate to="/login" />} />
            <Route path="/checkout" element={session ? <Checkout cart={cart} setCart={setCart} session={session} darkMode={darkMode} /> : <Navigate to="/login" />} />
            <Route path="/orders" element={session ? <Orders darkMode={darkMode} /> : <Navigate to="/login" />} />
            <Route path="/order-success" element={session ? <OrderSuccess darkMode={darkMode} /> : <Navigate to="/login" />} />
            <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} darkMode={darkMode} />} />
            <Route path="/admin" element={isAdmin ? <Admin darkMode={darkMode} /> : <Navigate to="/" />} />
            <Route path="/update-password" element={<UpdatePassword darkMode={darkMode} />} />
            <Route path="/profile" element={session ? <Profile userProfile={userProfile} session={session} darkMode={darkMode} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}