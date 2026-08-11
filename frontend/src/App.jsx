import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, Settings, LogOut } from 'lucide-react';
import Login from './pages/Login';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Inventory from './pages/Inventory';
import Challans from './pages/Challans';
import UsersPage from './pages/Users';
import api, { getDashboardStats } from './api';

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active bg-primary bg-opacity-10 text-primary border-r-4 border-primary' : '';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Package className="text-primary" size={28} />
        <span>Mini ERP</span>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/customers" className={`nav-item ${isActive('/customers')}`}>
          <Users size={20} />
          <span>Customers</span>
        </Link>
        <Link to="/inventory" className={`nav-item ${isActive('/inventory')}`}>
          <Package size={20} />
          <span>Inventory</span>
        </Link>
        <Link to="/challans" className={`nav-item ${isActive('/challans')}`}>
          <FileText size={20} />
          <span>Sales Challans</span>
        </Link>
        {user?.role === 'ADMIN' && (
          <Link to="/users" className={`nav-item ${isActive('/users')}`}>
            <Settings size={20} />
            <span>Manage Users</span>
          </Link>
        )}
      </nav>
      <div className="mt-auto p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <button onClick={onLogout} className="nav-item w-full text-danger justify-start" style={{ color: 'var(--color-danger)' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const Topbar = ({ user }) => {
  return (
    <header className="topbar">
      <div className="font-semibold text-lg" style={{ color: 'var(--color-text-main)' }}>Welcome, {user?.name || 'User'}</div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold uppercase" style={{ background: 'linear-gradient(135deg, var(--color-primary-start), var(--color-primary-end))', color: 'white', boxShadow: '0 4px 10px var(--color-primary-glow)' }}>
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ totalCustomers: 0, lowStockItems: 0, pendingChallans: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="flex gap-4">
        <Link to="/customers" className="card flex-1 hover:shadow-md cursor-pointer transition-shadow" style={{ textDecoration: 'none' }}>
          <h3 className="text-muted">Total Customers</h3>
          <p className="text-2xl font-bold mt-2 text-black">{stats.totalCustomers}</p>
        </Link>
        <Link to="/inventory?filter=low_stock" className="card flex-1 hover:shadow-md cursor-pointer transition-shadow" style={{ textDecoration: 'none' }}>
          <h3 className="text-muted">Low Stock Items</h3>
          <p className={`text-2xl font-bold mt-2 ${stats.lowStockItems > 0 ? 'text-danger' : 'text-success'}`}>
            {stats.lowStockItems}
          </p>
        </Link>
        <Link to="/challans?status=DRAFT" className="card flex-1 hover:shadow-md cursor-pointer transition-shadow" style={{ textDecoration: 'none' }}>
          <h3 className="text-muted">Pending Challans</h3>
          <p className={`text-2xl font-bold mt-2 ${stats.pendingChallans > 0 ? 'text-warning' : 'text-success'}`}>
            {stats.pendingChallans}
          </p>
        </Link>
      </div>
    </div>
  );
};

const Layout = ({ children, user, onLogout }) => (
  <div className="app-container">
    <Sidebar onLogout={onLogout} user={user} />
    <main className="main-content">
      <Topbar user={user} />
      <div className="page-content">
        {children}
      </div>
    </main>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Optionally verify token with backend here
    }
    setLoading(false);

    // Listen for global unauthorized events (e.g. expired token)
    const handleUnauthorized = () => handleLogout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return null;

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers user={user} />} />
          <Route path="/customers/:id" element={<CustomerDetail user={user} />} />
          <Route path="/inventory" element={<Inventory user={user} />} />
          <Route path="/challans" element={<Challans user={user} />} />
          {user.role === 'ADMIN' && <Route path="/users" element={<UsersPage />} />}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
