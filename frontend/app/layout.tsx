import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Red de Consejeros - Fase 1',
  description: 'Placeholder frontend',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
