import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PrintForge - P2P 3D Printing Marketplace',
  description: 'Piattaforma avanzata per la stampa 3D locale: visualizzatore R3F, geolocalizzazione PostGIS, Smart Matching e garanzia Escrow Stripe.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
