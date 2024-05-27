import AccountSidebar from "../components/Account";
import Dashboard from "../components/Dashboard";

export default function Home(){
    return <main className="flex flex-1 flex-col h-full bg-gray-100">
        <div
            className="sm:mt-20 flex text-black text-hd1mb border-b border-gray-300 w-full py-6 px-8 font-Montserrat font-bold">
            Dashboard
        </div>
        <div className="flex flex-1 min-h-0">
            <AccountSidebar/>
            <Dashboard/>
        </div>
    </main>
}
