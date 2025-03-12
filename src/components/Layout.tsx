import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, Calendar, House, List, Menu, Trophy, Users, X } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'nav-item-active' : '';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-emerald-50">
      {/* Header & Navbar */}
      <header className="bg-gradient-to-r from-teal-800 to-teal-900 text-white shadow-md">
        <div className="container mx-auto">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center justify-between py-4 px-6">
            <Link to="/" className="flex items-center gap-3">
              <Trophy className="text-amber-400" size={28} />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-amber-300 text-transparent bg-clip-text">
                  Karta Cup V
                </h1>
                <p className="text-emerald-200 text-xs">Turnamen Sepak Bola</p>
              </div>
            </Link>
            
            <button 
              className="md:hidden text-white"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* Navigation - Desktop */}
          <nav className="hidden md:flex py-2 px-6 border-t border-teal-700">
            <ul className="flex space-x-1">
              <li>
                <Link to="/" className={`nav-item ${isActive('/')}`}>
                  <House size={18} />
                  <span>Beranda</span>
                </Link>
              </li>
              <li>
                <Link to="/tim" className={`nav-item ${isActive('/tim')}`}>
                  <Users size={18} />
                  <span>Tim</span>
                </Link>
              </li>
              <li>
                <Link to="/jadwal" className={`nav-item ${isActive('/jadwal')}`}>
                  <Calendar size={18} />
                  <span>Jadwal</span>
                </Link>
              </li>
              <li>
                <Link to="/hasil" className={`nav-item ${isActive('/hasil')}`}>
                  <List size={18} />
                  <span>Hasil Pertandingan</span>
                </Link>
              </li>
              <li>
                <Link to="/klasemen" className={`nav-item ${isActive('/klasemen')}`}>
                  <Trophy size={18} />
                  <span>Klasemen</span>
                </Link>
              </li>
              <li>
                <Link to="/pencetak-gol" className={`nav-item ${isActive('/pencetak-gol')}`}>
                  <Award size={18} />
                  <span>Pencetak Gol</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Mobile Navigation */}
        <nav className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} bg-teal-900 border-t border-teal-700`}>
          <ul className="px-4 py-2 space-y-2">
            <li>
              <Link 
                to="/" 
                className={`mobile-nav-item ${isActive('/')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <House size={18} />
                <span>Beranda</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/tim" 
                className={`mobile-nav-item ${isActive('/tim')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users size={18} />
                <span>Tim</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/jadwal" 
                className={`mobile-nav-item ${isActive('/jadwal')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calendar size={18} />
                <span>Jadwal</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/hasil" 
                className={`mobile-nav-item ${isActive('/hasil')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <List size={18} />
                <span>Hasil Pertandingan</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/klasemen" 
                className={`mobile-nav-item ${isActive('/klasemen')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Trophy size={18} />
                <span>Klasemen</span>
              </Link>
            </li>
            <li>
              <Link 
                to="/pencetak-gol" 
                className={`mobile-nav-item ${isActive('/pencetak-gol')}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Award size={18} />
                <span>Pencetak Gol</span>
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-7xl mx-auto py-4 px-6">
          <h1 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
            {location.pathname === '/' && (
              <>
                <House size={24} className="text-teal-600" />
                <span>Beranda</span>
              </>
            )}
            {location.pathname === '/tim' && (
              <>
                <Users size={24} className="text-teal-600" />
                <span>Daftar Tim</span>
              </>
            )}
            {location.pathname.startsWith('/tim/') && (
              <>
                <Users size={24} className="text-teal-600" />
                <span>Detail Tim</span>
              </>
            )}
            {location.pathname === '/jadwal' && (
              <>
                <Calendar size={24} className="text-teal-600" />
                <span>Jadwal Pertandingan</span>
              </>
            )}
            {location.pathname === '/hasil' && (
              <>
                <List size={24} className="text-teal-600" />
                <span>Hasil Pertandingan</span>
              </>
            )}
            {location.pathname.startsWith('/pertandingan/') && (
              <>
                <List size={24} className="text-teal-600" />
                <span>Detail Pertandingan</span>
              </>
            )}
            {location.pathname === '/klasemen' && (
              <>
                <Trophy size={24} className="text-teal-600" />
                <span>Klasemen</span>
              </>
            )}
            {location.pathname === '/pencetak-gol' && (
              <>
                <Award size={24} className="text-teal-600" />
                <span>Daftar Pencetak Gol</span>
              </>
            )}
          </h1>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-grow py-6 px-6">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100 py-4 text-center text-sm text-emerald-600">
        Aplikasi Pengelolaan Turnamen Karta Cup V - Dibuat dengan ♥
      </footer>
    </div>
  );
};

export default Layout;
