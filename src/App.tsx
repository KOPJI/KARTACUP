import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Beranda from './pages/Beranda';
import DaftarTim from './pages/DaftarTim';
import DetailTim from './pages/DetailTim';
import Jadwal from './pages/Jadwal';
import Klasemen from './pages/Klasemen';
import HasilPertandingan from './pages/HasilPertandingan';
import DetailPertandingan from './pages/DetailPertandingan';
import PencetakGol from './pages/PencetakGol';
import KartuLarangan from './pages/KartuLarangan';
import { initializeData } from './utils/dataInitializer';
import './index.css';

function App() {
  useEffect(() => {
    // Memuat font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Inisialisasi data jika belum ada
    initializeData();

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Beranda />} />
        <Route path="/tim" element={<DaftarTim />} />
        <Route path="/tim/:id" element={<DetailTim />} />
        <Route path="/jadwal" element={<Jadwal />} />
        <Route path="/klasemen" element={<Klasemen />} />
        <Route path="/hasil" element={<HasilPertandingan />} />
        <Route path="/pertandingan/:id" element={<DetailPertandingan />} />
        <Route path="/pencetak-gol" element={<PencetakGol />} />
        <Route path="/kartu-larangan" element={<KartuLarangan />} />
      </Routes>
    </Layout>
  );
}

export default App;
