import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import CustomerRoute from './routes/CustomerRoute';
import SellerRoute from './routes/SellerRoute';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import ProductsPage from './pages/customer/ProductsPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import BookingPage from './pages/customer/BookingPage';
import MyRentalsPage from './pages/customer/MyRentalsPage';
import RentalDetailPage from './pages/customer/RentalDetailPage';
import PaymentPage from './pages/customer/PaymentPage';
import ProfilePage from './pages/customer/ProfilePage';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import CustomerProductRentalsPage from './pages/customer/CustomerProductRentalsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import SellerRegisterPage from './pages/auth/SellerRegisterPage';
import SellerDashboardPage from './pages/customer/SellerDashboardPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminAddEditProductPage from './pages/admin/AdminAddEditProductPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminRentalsPage from './pages/admin/AdminRentalsPage';
import AdminReturnsPage from './pages/admin/AdminReturnsPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSellersPage from './pages/admin/AdminSellersPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
          <Navbar />
          
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={
                <SellerRoute><AdminAddEditProductPage /></SellerRoute>
              } />
              <Route path="/my-products/edit/:id" element={
                <SellerRoute><AdminAddEditProductPage /></SellerRoute>
              } />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/seller/register" element={<SellerRegisterPage />} />
              <Route path="/seller/dashboard" element={
                <SellerRoute><SellerDashboardPage /></SellerRoute>
              } />
              <Route path="/seller/inventory" element={
                <SellerRoute><AdminProductsPage ownerOnly /></SellerRoute>
              } />
              <Route path="/seller/products/new" element={
                <SellerRoute><AdminAddEditProductPage /></SellerRoute>
              } />
              <Route path="/seller/products/edit/:id" element={
                <SellerRoute><AdminAddEditProductPage /></SellerRoute>
              } />
              <Route path="/seller/rentals" element={
                <SellerRoute><AdminRentalsPage ownerOnly /></SellerRoute>
              } />
              <Route path="/seller/returns" element={
                <SellerRoute><AdminReturnsPage ownerOnly /></SellerRoute>
              } />
              <Route path="/seller/reports" element={
                <SellerRoute><AdminReportsPage ownerOnly /></SellerRoute>
              } />

              {/* Customer Protected Routes */}
              <Route path="/booking/:productId" element={
                <CustomerRoute><BookingPage /></CustomerRoute>
              } />
              <Route path="/my-rentals" element={
                <CustomerRoute><MyRentalsPage /></CustomerRoute>
              } />
              <Route path="/rentals/:id" element={
                <CustomerRoute><RentalDetailPage /></CustomerRoute>
              } />
              <Route path="/payment/:rentalId" element={
                <CustomerRoute><PaymentPage /></CustomerRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <CustomerRoute><CustomerDashboardPage /></CustomerRoute>
              } />
              <Route path="/my-products" element={
                <SellerRoute><AdminProductsPage ownerOnly /></SellerRoute>
              } />
              <Route path="/my-reports" element={
                <SellerRoute><AdminReportsPage ownerOnly /></SellerRoute>
              } />
              <Route path="/product-rentals" element={
                <SellerRoute><CustomerProductRentalsPage /></SellerRoute>
              } />

              {/* Admin Protected Routes */}
              <Route path="/admin/dashboard" element={
                <AdminRoute><AdminDashboardPage /></AdminRoute>
              } />
              <Route path="/admin/products" element={
                <AdminRoute><AdminProductsPage /></AdminRoute>
              } />
              <Route path="/admin/products/new" element={
                <AdminRoute><AdminAddEditProductPage /></AdminRoute>
              } />
              <Route path="/admin/products/edit/:id" element={
                <AdminRoute><AdminAddEditProductPage /></AdminRoute>
              } />
              <Route path="/admin/categories" element={
                <AdminRoute><AdminCategoriesPage /></AdminRoute>
              } />
              <Route path="/admin/customers" element={
                <AdminRoute><AdminCustomersPage /></AdminRoute>
              } />
              <Route path="/admin/rentals" element={
                <AdminRoute><AdminRentalsPage /></AdminRoute>
              } />
              <Route path="/admin/returns" element={
                <AdminRoute><AdminReturnsPage /></AdminRoute>
              } />
              <Route path="/admin/payments" element={
                <AdminRoute><AdminPaymentsPage /></AdminRoute>
              } />
              <Route path="/admin/reports" element={
                <AdminRoute><AdminReportsPage /></AdminRoute>
              } />
              <Route path="/admin/sellers" element={
                <AdminRoute><AdminSellersPage /></AdminRoute>
              } />

              {/* 404 Fallback */}
              <Route path="*" element={
                <div className="text-center py-16">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">404 - Page Not Found</h2>
                  <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
                  <a href="/" className="bg-sky-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm">
                    Back to Home
                  </a>
                </div>
              } />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
