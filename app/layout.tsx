import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GameHub – Sistema de Renta',
  description: 'Sistema de administración de renta de consolas de videojuegos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}