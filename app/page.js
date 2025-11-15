"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";

export default function Page() {
  const { user, ready } = useAuth() || {};
  const router = useRouter();

  useEffect(() => {
    console.log("🧩 useAuth values:", { user, ready });
    if (!ready) return;
    if (user) router.replace("/home");
    else router.replace("/login");
  }, [ready, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p>Cargando...</p>
      </div>
    </div>
  );
}
