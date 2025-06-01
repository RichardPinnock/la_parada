// app/layout.tsx
import "./globals.css";
import Header from "./Header";
import Providers from "./providers";
import { Toaster } from "sonner";

export const metadata = {
  title: "La Parada POS System",
  description: "",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Toaster richColors position="top-right" />
          </div>
        </Providers>
      </body>
    </html>
  );
}
