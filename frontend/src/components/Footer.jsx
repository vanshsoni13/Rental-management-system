import React from 'react';
import { Boxes, Shield, Clock, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[var(--ink)] text-[#cbd2c9] text-sm border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1.2fr] gap-10 mb-12">
          
          {/* Brand Info */}
          <div>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-9 h-9 bg-[var(--gold)] flex items-center justify-center text-[var(--ink)]">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-serif font-black text-xl text-white tracking-tight">RentHub</span>
                <span className="block mt-1 text-[8px] uppercase tracking-[.24em] text-[var(--gold)]">Objects for projects</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
            Rental management platform. Rent high quality tools, cameras, equipment, and gear with flexible hourly, daily, and monthly rates.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/" className="hover:text-white transition">Home</a></li>
              <li><a href="/products" className="hover:text-white transition">Product Catalog</a></li>
              <li><a href="/login" className="hover:text-white transition">Customer Portal</a></li>
              <li><a href="/login" className="hover:text-white transition">Admin Portal</a></li>
            </ul>
          </div>

          {/* Rental Features */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Why Rent With Us</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center"><Shield className="w-4 h-4 text-sky-500 mr-2" /> Verified Equipment Quality</li>
              <li className="flex items-center"><Clock className="w-4 h-4 text-sky-500 mr-2" /> Real-time Stock Lock</li>
              <li className="flex items-center"><Shield className="w-4 h-4 text-sky-500 mr-2" /> Secure Mock & Deposit Flow</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support & Contact</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center"><MapPin className="w-4 h-4 text-sky-500 mr-2" /> University Campus Center, IN</li>
              <li className="flex items-center"><Mail className="w-4 h-4 text-sky-500 mr-2" /> support@renthub.com</li>
              <li className="flex items-center"><Phone className="w-4 h-4 text-sky-500 mr-2" /> +91 98765 43210</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} RentHub Rental Management System. </p>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
