import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";

export const metadata = {
  title: "Supabase Chat",
  description: "Chat en tiempo real con Supabase y Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {/* 👇 El AuthProvider ENVUELVE toda la app */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
