import { MainNav } from "@/common/main-nav";
import TeamSwitcher from "@/common/team-switcher";
import { UserNav } from "@/common/user-nav";

const Layout = ({ children }) => {
  return (
    <>
      <div className="hidden flex-1 flex-col md:flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
            <TeamSwitcher />
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Layout;
