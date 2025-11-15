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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
