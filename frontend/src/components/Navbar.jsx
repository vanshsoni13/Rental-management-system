import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Boxes, 
  User, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  ShoppingBag, 
  RotateCcw, 
  BarChart3, 
  Layers,
  KeyRound,
  PlusCircle
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, loading, logoutSession } = useAuth();
  const isSeller = user?.role === 'seller';
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutSession();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-[var(--white)] border-b border-[var(--line)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-[var(--ink)] border border-[var(--ink)] flex items-center justify-center text-[var(--gold)] font-bold text-xl">
              <Boxes className="w-6 h-6" />
            </div>
            <div className="leading-none">
              <span className="block font-serif font-black text-xl text-[var(--ink)] tracking-tight">RentHub</span>
              <span className="block mt-1 text-[8px] uppercase tracking-[.28em] text-[var(--rust)]">Rental Library</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>

            <Link
              to="/products"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive('/products') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Catalog
            </Link>

            {isAuthenticated && user?.role === 'customer' && (
              <Link
                to="/my-rentals"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/my-rentals') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                My Rentals
              </Link>
            )}

            {isAuthenticated && user?.role === 'customer' && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/dashboard') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
              </>
            )}

            {isAuthenticated && isSeller && (
              <>
                <Link
                  to="/seller/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/seller/dashboard') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-rentals"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/my-rentals') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  My Rentals
                </Link>
                <Link
                  to="/seller/inventory"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/seller/inventory') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Inventory
                </Link>
                <Link
                  to="/seller/rentals"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/seller/rentals') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Rentals
                </Link>
                <Link
                  to="/seller/returns"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/seller/returns') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Returns
                </Link>
                <Link
                  to="/seller/reports"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive('/seller/reports') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Reports
                </Link>
              </>
            )}

            {/* Admin Links */}
            {isAdmin && (
              <div className="flex items-center space-x-1 pl-2 border-l border-gray-200">
                <Link
                  to="/admin/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition ${
                    isActive('/admin/dashboard') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/admin/products"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition ${
                    isActive('/admin/products') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Inventory</span>
                </Link>

                <Link
                  to="/admin/sellers"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition ${
                    isActive('/admin/sellers') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Sellers</span>
                </Link>

                <Link
                  to="/admin/rentals"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition ${
                    isActive('/admin/rentals') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Rentals</span>
                </Link>

                <Link
                  to="/admin/returns"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition ${
                    isActive('/admin/returns') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Returns</span>
                </Link>

                <Link
                  to="/admin/reports"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1 transition ${
                    isActive('/admin/reports') ? 'text-sky-600 bg-sky-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Reports</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Right Action / Auth Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {!loading && isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {isAuthenticated && isSeller && (
                  <Link
                    to="/seller/products/new"
                    className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition inline-flex items-center space-x-1 shadow-sm shadow-sky-200"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Product</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-50 transition border border-gray-100"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm overflow-hidden border border-sky-200">
                    {user?.profile_image ? (
                      <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="text-left pr-1">
                    <p className="text-xs font-bold text-gray-900 line-clamp-1">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">{user?.role}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : null}

            {!loading && !isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-sky-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow-sm shadow-sky-200"
                >
                  Register
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-4 space-y-1">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Home</Link>
          <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Products Catalog</Link>
          
          {isAuthenticated && user?.role === 'customer' && (
            <Link to="/my-rentals" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">My Rentals</Link>
          )}

          {isAuthenticated && user?.role === 'customer' && (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Dashboard</Link>
            </>
          )}

          {isSeller && (
            <>
              <Link to="/seller/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Seller Dashboard</Link>
              <Link to="/my-rentals" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">My Rentals</Link>
              <Link to="/seller/products/new" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-semibold text-sky-700 hover:bg-sky-50">Add Product</Link>
              <Link to="/seller/inventory" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Inventory</Link>
              <Link to="/seller/rentals" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Rentals</Link>
              <Link to="/seller/returns" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Returns</Link>
              <Link to="/seller/reports" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Reports</Link>
            </>
          )}

          {isAdmin && (
            <div className="pt-2 border-t border-gray-100 space-y-1">
              <span className="text-xs font-bold text-gray-400 px-3 uppercase tracking-wider">Admin Menu</span>
              <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Dashboard</Link>
              <Link to="/admin/sellers" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Seller Applications</Link>
              <Link to="/admin/products" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Inventory</Link>
              <Link to="/admin/rentals" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Rentals</Link>
              <Link to="/admin/returns" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Returns</Link>
              <Link to="/admin/reports" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50">Reports</Link>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            {!loading && isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-base overflow-hidden border border-sky-200">
                    {user?.profile_image ? (
                      <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  My Profile
                </Link>
                {user?.role === 'customer' && (
                  <Link
                    to="/my-rentals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    My Rentals
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}

            {!loading && !isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-2 border rounded-lg font-semibold text-gray-700">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-center py-2 bg-sky-600 text-white rounded-lg font-semibold">Register</Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
