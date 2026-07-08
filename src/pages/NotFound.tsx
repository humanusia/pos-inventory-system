import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
        <p className="text-slate-500 text-lg">Halaman tidak ditemukan</p>
        <Link
          to="/"
          className="btn-primary inline-flex"
        >
          <Home size={16} />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
