import { EventType } from "@/lib/enum";
import { DataManager } from "@/lib/manager/DataManager";
import { EventManager } from "@/lib/manager/EventManager";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const location = useLocation();

  if (location.pathname == "/transfer") {
    DataManager.instance.curMenu = "send&receive";
  } else if (location.pathname == "/tx") {
    DataManager.instance.curMenu = "transaction";
  }

  const [menuType, setMenuType] = useState(DataManager.instance.curMenu);

  const handleClick = () => {
    setMenuType(DataManager.instance.curMenu);
  };

  console.log(menuType);

  const reload = () => {
    setMenuType(DataManager.instance.curMenu);
  };

  useEffect(() => {
    EventManager.instance.subscribe(EventType.main_nav_reload, reload);

    return EventManager.instance.unsubscribe(EventType.main_nav_reload, reload);
  }, []);

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        to="/"
        className={cn(
          "text-sm font-medium text-white001 transition-colors hover:text-primary004 font-SourceSanPro",
          menuType == "asset" ? "text-primary004" : ""
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
          menuType == "transaction" ? "text-primary004" : ""
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
          menuType == "send&receive" ? "text-primary004" : ""
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

      <Link
        to="/dispatch"
        className={cn(
          "text-sm font-medium text-white001 transition-colors hover:text-primary004 font-SourceSanPro",
          menuType == "send&receive" ? "text-primary004" : ""
        )}
        onClick={() => {
          DataManager.instance.curMenu = "Dispatch";
          handleClick();
        }}
      >
        Dispatch
      </Link>
    </nav>
  );
}
