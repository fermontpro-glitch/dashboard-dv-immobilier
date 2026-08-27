import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { getConfiguredAccounts } from "@/lib/meta/accounts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const accounts = getConfiguredAccounts();

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header accounts={accounts} />
        <main className="flex-1 bg-blossom px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
