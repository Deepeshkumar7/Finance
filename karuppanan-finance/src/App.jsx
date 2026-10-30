import React, { useState, useEffect } from 'react';
import { 
  LogOut, Plus, Trash2, Edit2, X, 
  CalendarDays, ArrowRight, Wallet, ShieldCheck,
  Search, MapPin, Phone, Users, TrendingUp, ChevronDown, Mail, WifiOff
} from 'lucide-react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const API_URL = 'https://finance-6w4c.onrender.com/api';

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Auth States
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [identifier, setIdentifier] = useState(''); 
  const [email, setEmail] = useState(''); 
  const [phone, setPhone] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Dashboard States
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedDay, setSelectedDay] = useState('Sunday');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', village: '', principal: '', interest: '' });

  // 1. Offline Database Read
  const clients = useLiveQuery(
    () => db.clients.where('day').equals(selectedDay).toArray(),
    [selectedDay]
  ) || [];

  // Listen for Internet Connection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for Auth changes (LocalStorage only - NO FIREBASE)
  useEffect(() => {
    const savedUser = localStorage.getItem('financeUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Background Sync Engine
  useEffect(() => {
    const syncData = async () => {
      if (!isOnline || !user) return;
      try {
        const pendingClients = await db.clients.where({ isPendingSync: 1 }).toArray();
        
        for (const client of pendingClients) {
          const clientData = { ...client };
          delete clientData.isPendingSync; 
          
          if (client.id.includes('-')) {
            await fetch(`${API_URL}/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientData) });
          } else {
            await fetch(`${API_URL}/clients/${client.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientData) });
          }
          await db.clients.update(client.id, { isPendingSync: 0 });
        }

        const res = await fetch(`${API_URL}/clients?userId=${user.uid || user.email}&day=${selectedDay}`);
        if (res.ok) {
          const serverClients = await res.json();
          for (const sc of serverClients) {
            sc.isPendingSync = 0;
            sc.id = sc._id; 
            await db.clients.put(sc);
          }
        }
      } catch (err) {
        console.error("Sync failed:", err);
      }
    };

    syncData();
    const interval = setInterval(syncData, 15000); 
    return () => clearInterval(interval);
  }, [user, isOnline, selectedDay]);

  // --- CUSTOM AUTHENTICATION METHODS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setUser(data);
      localStorage.setItem('financeUser', JSON.stringify(data));
      setCurrentTab('dashboard');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSignupSendOtp = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (password !== confirmPassword) return setAuthError('Passwords do not match');
    if (password.length < 6) return setAuthError('Password must be at least 6 characters');
    
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setShowOtpInput(true);
      setAuthSuccess('Verification OTP sent to ' + email);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSignupVerify = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, password, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setUser(data);
      localStorage.setItem('financeUser', JSON.stringify(data));
      setCurrentTab('dashboard');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('financeUser');
    setUser(null);
    setCurrentTab('dashboard');
  };

  // --- DASHBOARD METHODS (OFFLINE FIRST) ---
  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.principal) return;
    
    const clientData = {
      id: crypto.randomUUID(), 
      userId: user.uid || user.email,
      day: selectedDay,
      name: newClient.name,
      phone: newClient.phone,
      village: newClient.village,
      principal: Number(newClient.principal),
      interest: Number(newClient.interest || 0),
      totalPaid: 0,
      paymentHistory: [],
      isPendingSync: 1
    };

    await db.clients.add(clientData); 
    setNewClient({ name: '', phone: '', village: '', principal: '', interest: '' });
    setShowAddForm(false);
  };

  const routeStats = clients.reduce((acc, client) => {
    const interestAmt = client.principal * (client.interest || 0) / 100;
    const totalLoan = client.principal + interestAmt;
    acc.expected += totalLoan;
    acc.collected += (client.totalPaid || 0);
    acc.pending += (totalLoan - (client.totalPaid || 0));
    return acc;
  }, { expected: 0, collected: 0, pending: 0 });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.village && c.village.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-emerald-600">Loading App...</div>;
  }

  // --- LOGIN SCREEN (NO FIREBASE) ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9] p-4 font-sans selection:bg-emerald-500 selection:text-white">
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.06)] flex overflow-hidden border border-gray-100 min-h-[600px] flex-col md:flex-row">
          
          <div className="hidden md:flex md:w-5/12 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-12">
                <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-500/30">
                  <Wallet className="text-white" size={24} />
                </div>
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  Karuppanan <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Finance</span>
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.15] mb-6">
                Master your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">collections.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
                Secure access via Email or Phone. Designed for offline-first reliability.
              </p>
            </div>
          </div>

          <div className="w-full md:w-7/12 p-8 md:p-14 lg:p-20 flex flex-col justify-center overflow-y-auto max-h-[90vh] md:max-h-full">
            <div className="md:hidden flex items-center gap-3 mb-10">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-lg shadow-sm">
                <Wallet className="text-white" size={20} />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Karuppanan <span className="text-emerald-600">Finance</span>
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{isLoginMode ? 'Welcome back' : 'Create an account'}</h3>
              <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
                {isLoginMode ? "Enter your details to access your dashboard." : "Sign up to start managing your routes."}
              </p>
            </div>

            {/* LOGIN FORM */}
            {isLoginMode ? (
              <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email or Phone Number</label>
                  <input type="text" required value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full p-4 bg-gray-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium" placeholder="admin@example.com or +919876543210" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium" placeholder="••••••••" />
                </div>
                <button type="submit" disabled={isSending} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 mt-4 disabled:opacity-70">
                  {isSending ? 'Logging in...' : 'Log In'}
                </button>
              </form>
            ) : (
              /* SIGNUP FORM */
              !showOtpInput ? (
                <form onSubmit={handleSignupSendOtp} className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" placeholder="admin@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                      <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" placeholder="+91..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" placeholder="Min 6 characters" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
                    <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500" placeholder="Re-enter password" />
                  </div>
                  <button type="submit" disabled={isSending} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold mt-4 disabled:opacity-70 hover:bg-slate-800 transition-all">
                    {isSending ? 'Sending OTP...' : 'Send Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignupVerify} className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Enter 6-digit OTP sent to {email}</label>
                    <input type="text" required value={otp} onChange={e => setOtp(e.target.value)} className="w-full p-4 bg-gray-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-center tracking-[0.5em] text-lg font-medium" placeholder="------" maxLength={6} />
                  </div>
                  <button type="submit" disabled={isSending} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-70 hover:bg-emerald-700 transition-all">
                    {isSending ? 'Verifying...' : 'Verify & Create Account'}
                  </button>
                  <button type="button" onClick={() => setShowOtpInput(false)} className="w-full text-slate-500 font-bold text-sm mt-2">Go back and edit details</button>
                </form>
              )
            )}

            {/* TOGGLE MODE */}
            <div className="mt-8 text-center border-t border-gray-100 pt-6">
              <p className="text-sm text-slate-600 font-medium">
                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); setShowOtpInput(false); }} className="text-emerald-600 font-bold hover:underline">
                  {isLoginMode ? "Sign up" : "Log in"}
                </button>
              </p>
            </div>

            {authError && <p className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2 mt-4"><X size={18} /> {authError}</p>}
            {authSuccess && <p className="text-emerald-700 text-sm font-bold bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-2 mt-4"><ShieldCheck size={18} /> {authSuccess}</p>}
          </div>
        </div>
      </div>
    );
  }

  // --- MOBILE APP RENDER (AUTHENTICATED) ---
  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col font-sans overflow-hidden">
      
      {/* APP HEADER */}
      <header className="bg-slate-900 text-white px-4 pt-4 pb-2 z-10 shadow-sm shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="text-emerald-400" size={22} />
            <h1 className="text-lg font-extrabold tracking-tight">Karuppanan <span className="text-emerald-400">Finance</span></h1>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && <WifiOff size={16} className="text-red-400 animate-pulse" />}
            <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-300 truncate max-w-[120px]">
              {user.email?.split('@')[0] || user.phone || 'Admin'}
            </div>
          </div>
        </div>
        
        {/* Route/Day Selector Pill Scroll */}
        <div className="flex overflow-x-auto gap-2 scrollbar-hide py-2">
          {DAYS.map(day => (
            <button 
              key={day} 
              onClick={() => { setSelectedDay(day); setCurrentTab('lines'); }} 
              className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${
                selectedDay === day 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' 
                  : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </header>

      {/* SCROLLABLE MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pb-24 relative bg-gray-100">
        
        {/* DASHBOARD TAB */}
        {currentTab === 'dashboard' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-300">
            {!isOnline && (
              <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <WifiOff size={16} /> You are offline. Changes will save locally and sync later.
              </div>
            )}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">{selectedDay} Route Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 mb-1">{t('total_collected')}</p>
                  <p className="text-2xl font-black text-emerald-800">₹{routeStats.collected}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  <p className="text-xs font-bold text-red-600 mb-1">{t('total_pending')}</p>
                  <p className="text-2xl font-black text-red-800">₹{routeStats.pending}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 col-span-2 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-blue-600 mb-1">{t('active_customers')}</p>
                    <p className="text-xl font-black text-blue-800">{clients.length}</p>
                  </div>
                  <Users size={28} className="text-blue-300" />
                </div>
              </div>
            </div>

            <button onClick={() => setCurrentTab('lines')} className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold flex justify-between items-center shadow-md active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-3"><MapPin size={20} className="text-emerald-400"/> {t('start_route')}</div>
              <ArrowRight size={18} className="text-slate-400" />
            </button>
          </div>
        )}

        {/* LINES / COLLECTION TAB */}
        {currentTab === 'lines' && (
          <div className="animate-in fade-in duration-300 flex flex-col h-full">
            <div className="sticky top-0 bg-gray-100 p-4 z-10 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder={t('search')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                />
              </div>
            </div>

            <div className="px-4 pb-6 space-y-3">
              {filteredClients.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 mt-2">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400"><Users size={24} /></div>
                  <h3 className="text-base font-bold text-gray-700">No customers found</h3>
                  <p className="text-xs text-gray-500 mt-1">Adjust search or add a new client.</p>
                </div>
              ) : (
                filteredClients.map(client => <MobileClientCard key={client.id} client={client} />)
              )}
            </div>

            <button 
              onClick={() => setShowAddForm(true)}
              className="fixed bottom-24 right-6 bg-emerald-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform z-20"
            >
              <Plus size={24} />
            </button>
          </div>
        )}

        {/* SETTINGS TAB */}
        {currentTab === 'settings' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <Users size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{user.email || user.phone}</h2>
              <p className="text-sm text-gray-500 font-medium">Administrator</p>
              
              {/* LANGUAGE SWITCHER */}
              <div className="w-full mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">App Language / மொழி</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => i18n.changeLanguage('en')} className={`py-3 rounded-xl font-bold text-sm border transition-all ${i18n.language === 'en' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>English</button>
                  <button onClick={() => i18n.changeLanguage('ta')} className={`py-3 rounded-xl font-bold text-sm border transition-all ${i18n.language === 'ta' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>தமிழ்</button>
                  <button onClick={() => i18n.changeLanguage('ml')} className={`py-3 rounded-xl font-bold text-sm border transition-all ${i18n.language === 'ml' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>മലയാളം</button>
                  <button onClick={() => i18n.changeLanguage('te')} className={`py-3 rounded-xl font-bold text-sm border transition-all ${i18n.language === 'te' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>తెలుగు</button>
                </div>
              </div>

              <button 
                onClick={handleLogout} 
                className="mt-8 w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl border border-red-100 flex items-center justify-center gap-2 active:bg-red-100"
              >
                <LogOut size={18} /> Sign Out Securely
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FULL SCREEN MODAL: ADD CLIENT */}
      {showAddForm && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto flex flex-col">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-lg">{t('add_customer')}</h3>
            <button onClick={() => setShowAddForm(false)} className="p-2 bg-slate-800 rounded-full active:bg-slate-700"><X size={20}/></button>
          </div>
          <form onSubmit={handleAddClient} className="p-5 space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Route Day</label>
              <input type="text" disabled value={selectedDay} className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-gray-500 mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Customer Name</label>
              <input type="text" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none mt-1" placeholder="e.g. Ramesh" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
              <input type="tel" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none mt-1" placeholder="Optional" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Village / Area</label>
              <input type="text" value={newClient.village} onChange={e => setNewClient({...newClient, village: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none mt-1" placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Loan Amount</label>
                <input type="number" required value={newClient.principal} onChange={e => setNewClient({...newClient, principal: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none mt-1" placeholder="₹" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Interest %</label>
                <input type="number" value={newClient.interest} onChange={e => setNewClient({...newClient, interest: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none mt-1" placeholder="%" />
              </div>
            </div>
            <div className="pt-6">
              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform text-lg">Save Customer</button>
            </div>
          </form>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center pb-safe pt-2 px-2 z-40 h-16 shrink-0">
        <button onClick={() => setCurrentTab('dashboard')} className={`flex flex-col items-center justify-center w-20 h-full gap-1 transition-colors ${currentTab === 'dashboard' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <TrendingUp size={22} className={currentTab === 'dashboard' ? 'stroke-[2.5px]' : ''} />
          <span className="text-[10px] font-bold">Summary</span>
        </button>
        <button onClick={() => setCurrentTab('lines')} className={`flex flex-col items-center justify-center w-20 h-full gap-1 transition-colors ${currentTab === 'lines' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <CalendarDays size={22} className={currentTab === 'lines' ? 'stroke-[2.5px]' : ''} />
          <span className="text-[10px] font-bold">Route View</span>
        </button>
        <button onClick={() => setCurrentTab('settings')} className={`flex flex-col items-center justify-center w-20 h-full gap-1 transition-colors ${currentTab === 'settings' ? 'text-emerald-600' : 'text-gray-400'}`}>
          <Users size={22} className={currentTab === 'settings' ? 'stroke-[2.5px]' : ''} />
          <span className="text-[10px] font-bold">{t('profile')}</span>
        </button>
      </nav>
    </div>
  );
}

// --- MOBILE OPTIMIZED CLIENT CARD (OFFLINE ENABLED + i18n) ---
function MobileClientCard({ client }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(client);

  const interestAmount = client.principal * (client.interest || 0) / 100;
  const totalLoanAmount = client.principal + interestAmount;
  const remaining = totalLoanAmount - (client.totalPaid || 0);
  const isPaid = remaining <= 0;

  const handlePayment = async () => {
    if (!payAmount || isNaN(payAmount)) return;
    const amount = Number(payAmount);
    
    await db.clients.update(client.id, {
      totalPaid: (client.totalPaid || 0) + amount,
      paymentHistory: [...(client.paymentHistory || []), { date: new Date().toLocaleDateString('en-IN'), amount: amount }],
      isPendingSync: 1
    });
    setPayAmount('');
  };

  const handleDelete = async () => {
    if(window.confirm(`Delete customer ${client.name}? This cannot be undone.`)) {
      await db.clients.delete(client.id);
    }
  };

  const handleUpdate = async () => {
    await db.clients.update(client.id, { ...editData, isPendingSync: 1 });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-500 mb-3">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <span className="text-xs font-bold text-emerald-600">EDIT CUSTOMER</span>
          <button onClick={() => setIsEditing(false)}><X size={18} className="text-gray-400"/></button>
        </div>
        <div className="space-y-3">
          <input type="text" value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50 text-sm font-bold" placeholder="Name" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={editData.principal} onChange={e=>setEditData({...editData, principal: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50 text-sm" placeholder="Principal" />
            <input type="number" value={editData.interest} onChange={e=>setEditData({...editData, interest: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50 text-sm" placeholder="Interest %" />
          </div>
          <button onClick={handleUpdate} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl mt-2">Save Offline</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${isPaid ? 'border-emerald-200' : 'border-gray-200'} ${client.isPendingSync ? 'border-orange-300' : ''}`}>
      {isPaid && <div className="bg-emerald-500 text-white text-[10px] font-bold text-center py-0.5 tracking-widest uppercase">{t('fully_paid')}</div>}
      {client.isPendingSync === 1 && !isPaid && <div className="bg-orange-400 text-white text-[10px] font-bold text-center py-0.5 tracking-widest uppercase">Saved Offline - Sync Pending</div>}
      
      <div className="p-4" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">{client.name}</h3>
            <div className="flex items-center text-xs text-gray-500 font-medium mt-1 gap-3">
              {client.village && <span className="flex items-center gap-1"><MapPin size={12}/> {client.village}</span>}
              {client.phone && <span className="flex items-center gap-1"><Phone size={12}/> {client.phone}</span>}
            </div>
          </div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={18} />
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 rounded-xl py-2 border border-gray-100">
          <div className="text-center px-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Total</p>
            <p className="text-xs font-black text-slate-700">₹{totalLoanAmount}</p>
          </div>
          <div className="text-center px-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Paid</p>
            <p className="text-xs font-black text-emerald-600">₹{client.totalPaid || 0}</p>
          </div>
          <div className="text-center px-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Due</p>
            <p className="text-xs font-black text-red-600">₹{remaining}</p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="bg-slate-50 border-t border-gray-100 p-4">
          {!isPaid ? (
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={payAmount} 
                  onChange={e => setPayAmount(e.target.value)} 
                  className="w-full pl-8 pr-3 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm" 
                />
              </div>
              <button 
                onClick={handlePayment} 
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm active:bg-emerald-700 whitespace-nowrap"
              >
                Collect
              </button>
            </div>
          ) : (
            <div className="text-center text-xs font-bold text-emerald-600 bg-emerald-50 py-3 rounded-xl mb-4 border border-emerald-100">
              Loan is completely settled.
            </div>
          )}

          <div className="flex justify-between items-center border-t border-gray-200 pt-3">
            <div className="text-[10px] text-gray-400 font-bold">
              {client.paymentHistory?.length || 0} past payments
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(true)} className="p-2 bg-white text-gray-600 rounded-lg border shadow-sm active:bg-gray-50"><Edit2 size={16} /></button>
              <button onClick={handleDelete} className="p-2 bg-white text-red-600 rounded-lg border shadow-sm active:bg-red-50"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}