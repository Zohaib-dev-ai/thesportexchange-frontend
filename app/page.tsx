"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "./lib/auth";

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Redirect to investor login page
    router.push("/investor-login");
  }, [router]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center dark:bg-zinc-900">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-white"></div>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}
