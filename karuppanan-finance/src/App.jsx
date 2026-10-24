import React, { useState, useEffect } from 'react';
import { 
  LogOut, Plus, Trash2, Edit2, History, X, Save, 
  CalendarDays, Home, ArrowRight, Wallet, ShieldCheck 
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const API_URL = 'https://finance-6w4c.onrender.com/api';

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('financeUser')) || null);
  
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [currentView, setCurrentView] = useState('home');
  const [selectedDay, setSelectedDay] = useState('Sunday');
  const [clients, setClients] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', village: '', principal: '', interest: '' });

  const fetchClients = async () => {
    if (!user || currentView !== 'weekly') return;
    try {
      const res = await fetch(`${API_URL}/clients?userId=${user.uid}&day=${selectedDay}`);
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user, selectedDay, currentView]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    
    try {
      if (authMode === 'reset') {
        const res = await fetch(`${API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        setAuthSuccess('Password reset successfully! Please log in.');
        setAuthMode('login');
        setPassword('');
        return;
      }

      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setUser(data);
      localStorage.setItem('financeUser', JSON.stringify(data));
      setEmail('');
      setPassword('');
      setCurrentView('home');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('financeUser');
    setCurrentView('home');
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.principal) return;
    
    const clientData = {
      userId: user.uid,
      day: selectedDay,
      name: newClient.name,
      phone: newClient.phone,
      village: newClient.village,
      principal: Number(newClient.principal),
      interest: Number(newClient.interest || 0),
      totalPaid: 0,
      paymentHistory: []
    };

    await fetch(`${API_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    });
    
    setNewClient({ name: '', phone: '', village: '', principal: '', interest: '' });
    setShowAddForm(false);
    fetchClients();
  };

  // --- PREMIUM AUTHENTICATION SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9] p-4 font-sans selection:bg-emerald-500 selection:text-white">
        <div className="max-w-5xl w-full bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.06)] flex overflow-hidden border border-gray-100 min-h-[600px]">
          
          {/* Left Side - Branding (Hidden on mobile) */}
          <div className="hidden md:flex md:w-5/12 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              {/* Corrected Top Left Branding */}
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
                The professional dashboard to seamlessly manage client loans, track weekly payments, and secure your financial data.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 text-slate-300 text-sm font-medium bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
              <ShieldCheck size={20} className="text-emerald-400" />
              Bank-grade 256-bit encryption
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-7/12 p-8 md:p-14 lg:p-20 flex flex-col justify-center">
            
            {/* Mobile Branding */}
            <div className="md:hidden flex items-center gap-3 mb-10">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-lg shadow-sm">
                <Wallet className="text-white" size={20} />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Karuppanan <span className="text-emerald-600">Finance</span>
              </span>
            </div>

            <div className="mb-8">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {authMode === 'login' ? 'Welcome back' : authMode === 'register' ? 'Create an account' : 'Reset password'}
              </h3>
              <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">
                {authMode === 'login' ? 'Enter your credentials to access your secure dashboard.' : authMode === 'register' ? 'Set up your administration portal today.' : 'Enter your email to receive a new password.'}
              </p>
            </div>

            {authMode !== 'reset' && (
              <div className="flex bg-slate-100/80 p-1 rounded-xl mb-8 border border-slate-200">
                <button onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>Log In</button>
                <button onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === 'register' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>Register</button>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Work Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 placeholder-slate-400 font-medium" placeholder="admin@domain.com" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">
                    {authMode === 'reset' ? 'New Password' : 'Password'}
                  </label>
                  {authMode === 'login' && (
                    <button type="button" onClick={() => { setAuthMode('reset'); setAuthError(''); setAuthSuccess(''); }} className="text-sm text-emerald-600 font-bold hover:text-emerald-700 transition-colors">Forgot password?</button>
                  )}
                </div>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-gray-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-900 placeholder-slate-400 font-medium" placeholder="••••••••" />
              </div>

              {authError && <p className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2"><X size={18} className="shrink-0" /> {authError}</p>}
              {authSuccess && <p className="text-emerald-700 text-sm font-bold bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-2"><ShieldCheck size={18} /> {authSuccess}</p>}
              
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all flex justify-center items-center gap-2 mt-4 text-sm md:text-base group">
                {authMode === 'login' ? 'Sign In to Dashboard' : authMode === 'register' ? 'Create Secure Account' : 'Update Password'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              {authMode === 'reset' && (
                <button type="button" onClick={() => setAuthMode('login')} className="w-full mt-6 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">
                  &larr; Back to log in
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP RENDER (DASHBOARD) ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Wallet className="text-emerald-400" size={24} />
              Karuppanan <span className="text-emerald-400">Finance</span>
            </h1>
            {currentView !== 'home' && (
              <button onClick={() => setCurrentView('home')} className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"><Home size={16} /> Dashboard</button>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors"><LogOut size={16} /> <span className="hidden md:inline">Logout</span></button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {currentView === 'home' && (
          <div className="flex flex-col items-center justify-center mt-12 md:mt-24">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-12 text-center">Select a module to manage your financial records.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <button onClick={() => setCurrentView('weekly')} className="group relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-200 hover:border-emerald-500 transition-all duration-300 text-left overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="bg-emerald-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 text-emerald-600"><CalendarDays size={32} /></div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Weekly Finance</h3>
                  <p className="text-gray-500 mb-6">Track daily collections, manage client loans, and view payment histories.</p>
                  <div className="flex items-center text-emerald-600 font-bold group-hover:translate-x-2 transition-transform">Open Module <ArrowRight size={18} className="ml-2" /></div>
                </div>
              </button>
              <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 border-dashed flex flex-col items-center justify-center text-gray-400 min-h-[250px]"><Plus size={32} className="mb-2 opacity-50" /><p className="font-medium">Add New Module</p></div>
            </div>
          </div>
        )}

        {currentView === 'weekly' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setCurrentView('home')} className="md:hidden flex items-center gap-2 text-slate-600 font-medium mb-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100"><Home size={16} /> Dashboard</button>
            <div className="bg-white p-2 rounded-xl shadow-sm mb-6 flex overflow-x-auto gap-2 scrollbar-hide border border-gray-100">
              {DAYS.map(day => (
                <button key={day} onClick={() => setSelectedDay(day)} className={`px-5 py-2.5 rounded-lg whitespace-nowrap font-bold transition-all ${selectedDay === day ? 'bg-emerald-600 text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}>{day}</button>
              ))}
            </div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">{selectedDay} <span className="text-gray-400 font-normal">Collections</span></h2>
              <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 shadow-md transition-all"><Plus size={18} /> <span className="hidden md:inline">Add Person</span></button>
            </div>
            {showAddForm && (
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg mb-8 border border-emerald-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <h3 className="font-bold text-xl text-slate-800 mb-6">Register New Client</h3>
                <form onSubmit={handleAddClient} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <input type="text" placeholder="Full Name" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
                  <input type="tel" placeholder="Phone Number" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
                  <input type="text" placeholder="Village / Area" value={newClient.village} onChange={e => setNewClient({...newClient, village: e.target.value})} className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
                  <input type="number" placeholder="Loan Amount (₹)" required value={newClient.principal} onChange={e => setNewClient({...newClient, principal: e.target.value})} className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
                  <input type="number" placeholder="Interest (%)" value={newClient.interest} onChange={e => setNewClient({...newClient, interest: e.target.value})} className="p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white transition-colors" />
                  <div className="md:col-span-5 flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md transition-all">Save Client</button>
                  </div>
                </form>
              </div>
            )}
            <div className="space-y-4">
              {clients.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><CalendarDays size={24} /></div>
                  <h3 className="text-lg font-bold text-gray-700">No collections for {selectedDay}</h3>
                  <p className="text-gray-500 mt-1">Click "Add Person" to start tracking records.</p>
                </div>
              ) : (
                clients.map(client => <ClientCard key={client._id} client={client} refresh={fetchClients} />)
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ClientCard({ client, refresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(client);
  const [payAmount, setPayAmount] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const interestAmount = client.principal * (client.interest || 0) / 100;
  const totalLoanAmount = client.principal + interestAmount;
  const remaining = totalLoanAmount - (client.totalPaid || 0);

  const handleUpdate = async () => {
    await fetch(`${API_URL}/clients/${client._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData) });
    setIsEditing(false);
    refresh();
  };

  const handleDelete = async () => {
    await fetch(`${API_URL}/clients/${client._id}`, { method: 'DELETE' });
    refresh();
  };

  const handlePayment = async () => {
    if (!payAmount || isNaN(payAmount)) return;
    const amount = Number(payAmount);
    await fetch(`${API_URL}/clients/${client._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalPaid: (client.totalPaid || 0) + amount, paymentHistory: [...(client.paymentHistory || []), { date: new Date().toLocaleString(), amount: amount }] })
    });
    setPayAmount('');
    refresh();
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-emerald-500 relative">
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">EDITING</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-2">
          <div><label className="text-xs font-bold text-gray-500 uppercase">Name</label><input type="text" value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50 mt-1" /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Phone</label><input type="text" value={editData.phone} onChange={e=>setEditData({...editData, phone: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50 mt-1" /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Village</label><input type="text" value={editData.village} onChange={e=>setEditData({...editData, village: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50 mt-1" /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Loan Amount</label><input type="number" value={editData.principal} onChange={e=>setEditData({...editData, principal: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50 mt-1" /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Interest %</label><input type="number" value={editData.interest} onChange={e=>setEditData({...editData, interest: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50 mt-1" /></div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Total Paid</label><input type="number" value={editData.totalPaid} onChange={e=>setEditData({...editData, totalPaid: e.target.value})} className="w-full border p-2.5 rounded-lg bg-gray-50 mt-1" /></div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg flex items-center gap-2"><X size={18}/> Cancel</button>
          <button onClick={handleUpdate} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-2"><Save size={18}/> Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 transition-shadow duration-300">
      <div className="p-5 md:p-6 flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-slate-800">{client.name}</h3>
            {client.village && <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{client.village}</span>}
          </div>
          <p className="text-sm text-gray-500 mb-4 font-medium">{client.phone || 'No Phone'}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 flex flex-col"><span className="text-xs text-gray-400 font-bold uppercase mb-0.5">Total Loan</span><span className="font-bold text-slate-700">₹{totalLoanAmount}</span></div>
            <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 flex flex-col"><span className="text-xs text-emerald-600/70 font-bold uppercase mb-0.5">Paid</span><span className="font-bold text-emerald-700">₹{client.totalPaid || 0}</span></div>
            <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 flex flex-col"><span className="text-xs text-red-600/70 font-bold uppercase mb-0.5">Due</span><span className="font-bold text-red-700">₹{remaining}</span></div>
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full md:w-auto justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
          <div className="flex gap-2 w-full">
            <input type="number" placeholder="₹ Amount" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full md:w-32 p-3 bg-gray-50 border rounded-lg outline-none focus:border-emerald-500 font-semibold focus:bg-white transition-colors" />
            <button onClick={handlePayment} className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800">Pay</button>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowHistory(!showHistory)} className={`p-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold ${showHistory ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}><History size={18} /></button>
            <button onClick={() => setIsEditing(true)} className="p-2.5 bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors font-bold"><Edit2 size={18} /></button>
            {confirmDelete ? (
              <button onClick={handleDelete} className="p-2.5 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md">Delete?</button>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-2.5 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors font-bold"><Trash2 size={18} /></button>
            )}
          </div>
        </div>
      </div>
      {showHistory && (
        <div className="bg-slate-50 p-5 border-t border-gray-100 text-sm">
          <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><History size={16} className="text-blue-500" /> History</h4>
          {(!client.paymentHistory || client.paymentHistory.length === 0) ? <p className="text-gray-400 italic bg-white p-3 rounded-lg border">No payments.</p> : (
            <ul className="space-y-2">
              {client.paymentHistory.map((entry, idx) => (
                <li key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border"><span className="text-gray-500 font-medium">{entry.date}</span><span className="font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">+ ₹{entry.amount}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}