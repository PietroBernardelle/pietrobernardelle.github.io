import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Footer } from '@/components/Footer';
import { site } from '@/data/site';
import { publicUrl, siteOrigin } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: siteOrigin ? new URL(publicUrl('/')!) : undefined,
  robots: siteOrigin ? undefined : { index: false, follow: false },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  title: {
    default: `${site.name} — PhD researcher in AI at UQ`,
    template: `%s — ${site.shortName}`,
  },
  description: site.description,
};

const themeScript = `
  (() => {
    try {
      // Each visit starts from the device's light/dark setting; the toggle only
      // overrides it for the rest of the visit (this tab).
      localStorage.removeItem('pb-theme');
      const saved = sessionStorage.getItem('pb-theme');
      const theme = saved === 'light' || saved === 'dark'
        ? saved
        : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (_) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <ScrollToTop />
        <Header />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
