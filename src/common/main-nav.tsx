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

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        to="/"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          menuType == "asset" ? "" : "text-muted-foreground"
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
          "text-sm font-medium transition-colors hover:text-primary",
          menuType == "transaction" ? "" : "text-muted-foreground"
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
          "text-sm font-medium transition-colors hover:text-primary",
          menuType == "send&receive" ? "" : "text-muted-foreground"
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
