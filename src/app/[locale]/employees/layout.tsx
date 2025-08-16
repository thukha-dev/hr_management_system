"use client";

import { type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

export default function EmployeesLayout({ children }: { children: ReactNode }) {
  return <AppShell activePath="/employees">{children}</AppShell>;
}
