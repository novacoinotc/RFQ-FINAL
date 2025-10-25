import "./globals.css";
import Link from "next/link";

export const metadata = { title: "OTC RFQ" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
            <Link href="/" className="font-semibold">OTC RFQ</Link>
            <nav className="text-sm flex gap-3 ml-auto">
              <Link className="hover:underline" href="/login">Login</Link>
              <Link className="hover:underline" href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
