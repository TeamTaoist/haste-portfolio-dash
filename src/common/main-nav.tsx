import { DataManager } from "@/lib/manager/DataManager";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link } from "react-router-dom";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const [menuType, setMenuType] = useState(DataManager.instance.curMenu);

  const handleClick = () => {
    setMenuType(DataManager.instance.curMenu);
  };

  console.log(menuType);

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        to="/"
        className={cn(
          "text-sm font-medium text-white001 transition-colors hover:text-primary004 font-SourceSanPro",
          menuType == "asset" ? "text-primary004" : "",
        )}
        onClick={() => {
          DataManager.instance.curMenu = "asset";
          handleClick();
        }}
      >
        Asset
      </Link>
      <Link
        to="/tx"
        className={cn(
          "text-sm font-medium text-white001 transition-colors hover:text-primary004 font-SourceSanPro",
          menuType == "transaction" ? "text-primary004" : "",
        )}
        onClick={() => {
          DataManager.instance.curMenu = "transaction";
          handleClick();
        }}
      >
        Transaction
      </Link>
      <Link
        to="/transfer"
        className={cn(
          "text-sm font-medium text-white001 transition-colors hover:text-primary004 font-SourceSanPro",
          menuType == "send&receive" ? "text-primary004" : "",
          "text-white001"
        )}
        onClick={() => {
          DataManager.instance.curMenu = "send&receive";
          handleClick();
        }}
      >
        Send&Receive
      </Link>
      {/* <Link
        href="/examples/dashboard"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Receive
      </Link> */}
      {/* <Link
        href="/examples/dashboard"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Settings
      </Link> */}
    </nav>
  );
}
