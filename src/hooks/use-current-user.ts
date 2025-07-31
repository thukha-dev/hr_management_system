"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  role: string;
  email?: string;
  employeeId: string;
  // Add other user properties as needed
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // First check localStorage (for remember me)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        }

        // Then check sessionStorage
        const sessionUser = sessionStorage.getItem("user");
        if (sessionUser) {
          setUser(JSON.parse(sessionUser));
          setLoading(false);
          return;
        }

        // If no user in storage, fetch from API
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
