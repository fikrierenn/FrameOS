import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FrameOS - AI Video Analiz Platformu',
  description: 'Video ve fotoğraf analizi için yapay zeka platformu',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
