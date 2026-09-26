"use client";

import Link from 'next/link';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-blue-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            SignVerify
          </span>
        </Link>
        
        <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-300">
          <Link href="/" className="hover:text-blue-400 transition-colors">Beranda</Link>
          <Link href="/sign" className="hover:text-blue-400 transition-colors">Tanda Tangan</Link>
          <Link href="/verify" className="hover:text-blue-400 transition-colors">Verifikasi</Link>
          <Link href="/keys" className="hover:text-blue-400 transition-colors">Kunci</Link>
          <Link href="/about" className="hover:text-blue-400 transition-colors">Tentang</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <Link href="/sign" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-500/25">
              Mulai Tanda Tangan
            </Link>
          </div>
          
          {/* Hamburger Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-300 hover:text-white focus:outline-none p-1"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4 text-sm font-medium text-gray-300">
            <Link href="/" onClick={() => setIsOpen(false)} className="hover:text-blue-400 transition-colors">Beranda</Link>
            <Link href="/sign" onClick={() => setIsOpen(false)} className="hover:text-blue-400 transition-colors">Tanda Tangan</Link>
            <Link href="/verify" onClick={() => setIsOpen(false)} className="hover:text-blue-400 transition-colors">Verifikasi</Link>
            <Link href="/keys" onClick={() => setIsOpen(false)} className="hover:text-blue-400 transition-colors">Kunci</Link>
            <Link href="/about" onClick={() => setIsOpen(false)} className="hover:text-blue-400 transition-colors">Tentang</Link>
            
            <div className="pt-2 sm:hidden border-t border-gray-800">
              <Link href="/sign" onClick={() => setIsOpen(false)} className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-medium shadow-lg shadow-blue-500/25">
                Mulai Tanda Tangan
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
