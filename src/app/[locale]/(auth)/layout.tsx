import { Header } from "@/components/header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-black p-4">
        {children}
      </main>
    </div>
  );
}
