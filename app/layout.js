import './globals.css';

export const metadata = {
  title: 'Summerland Cottage | Book Your Stay',
  description: 'Check live availability and reserve Summerland Cottage with a secure deposit.',
  openGraph: {
    title: 'Summerland Cottage',
    description: 'A restored Summerland beach cottage near Montecito and Santa Barbara.',
    images: ['/assets/instagram/og-summerland-cottage.jpg']
  }
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
