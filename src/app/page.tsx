"use client"

import AccountSidebar from "./_components/Account";
import Dashboard from "./_components/Dashboard";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col min-h-screen bg-primary008">
      <div className="flex text-white001 text-hd1mb border-b border-primary004 w-full py-4 px-4 font-Montserrat">
        Dashboard
      </div>
      <div className="flex h-full">
        <AccountSidebar />
        <Dashboard />
      </div>
    </main>
  );
}
