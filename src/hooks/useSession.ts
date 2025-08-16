import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface UserSession {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image?: string | null;
}

export function useSession(required = false) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (data.authenticated && data.user) {
          setSession(data.user);
        } else if (required) {
          // Redirect to login if session is required but not found
          router.push("/en/login");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        if (required) {
          router.push("/en/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Set up a listener for auth state changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nextauth.message") {
        fetchSession();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [required, router]);

  return { session, loading };
}
