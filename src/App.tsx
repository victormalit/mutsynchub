// src/App.tsx
import { Outlet } from 'react-router-dom'; // Add this import
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet /> {/* This will now work */}
      </main>
      <Footer />
    </div>
  );
}