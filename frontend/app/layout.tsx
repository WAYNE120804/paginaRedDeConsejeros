import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Red de Consejeros UManizales',
  description: 'Portal institucional de la Red de Consejeros de la Universidad de Manizales',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
