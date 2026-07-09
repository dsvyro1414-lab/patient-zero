import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 p-3 sm:p-4 md:py-4 md:pr-4 md:pl-0">{children}</main>
    </div>
  );
}
