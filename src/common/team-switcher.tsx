"use client";

import * as React from "react";
import {
  CaretSortIcon,
  CheckIcon,
  // PlusCircledIcon,
} from "@radix-ui/react-icons";

import { cn, sortStr } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataManager } from "@/lib/manager/DataManager";
import { HttpManager } from "@/lib/api/HttpManager";
import { EventManager } from "@/lib/manager/EventManager";
import { EventType } from "@/lib/enum";
import { observer } from "mobx-react";
import { accountStore, AccountType } from "@/store/AccountStore";
import { autorun } from "mobx";
import QRCode from "qrcode.react";
import { useToast } from "@/components/ui/use-toast";
import {
  chooseMainNet,
  chooseTestNet,
  isTestNet,
} from "@/lib/wallet/constants";
import { CkbHepler } from "@/lib/wallet/CkbHelper";

let groups: { label: string; teams: { label: string; value: string }[] }[] = [];

type Team = (typeof groups)[number]["teams"][number];

const TeamSwitcher = observer(() => {
  const [open, setOpen] = React.useState(false);
  const [walletData, setWalletData] =
    React.useState<Record<string, AccountType[]>>();
  const { toast } = useToast();

  let curTeam: Team = {
    label: "",
    value: "",
  };

  const curAccount = DataManager.instance.getCurAccount();
  let findFlag = false;
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    for (let j = 0; j < group.teams.length; j++) {
      const team = group.teams[j];
      if (team.value == curAccount) {
        curTeam = team;
        findFlag = true;
        break;
      }
    }
    if (findFlag) break;
  }

  const copyTextToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copy Address Successful",
      });
    } catch (err) {
      toast({
        title: "Copy Address Failed",
      });
    }
  };

  const [selectedTeam, setSelectedTeam] = React.useState<Team>(curTeam);

  const reloadGroup = () => {
    groups = [];
    for (let i = 0; i < DataManager.instance.accounts.length; i++) {
      const element = DataManager.instance.accounts[i];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let group: any = undefined;
      for (let j = 0; j < groups.length; j++) {
        const itemGroup = groups[j];
        if (itemGroup.label == element.chain) {
          group = itemGroup;
          break;
        }
      }

      if (!group) {
        group = {
          label: element.chain,
          teams: [],
        };
        groups.push(group);
      }

      group.teams.push({
        label: element.addr,
        value: element.addr,
      });
    }

    if (groups.length > 0 && groups[0].teams.length > 0) {
      const selectOne = groups[0].teams[0];
      setSelectedTeam(selectOne);
      setOpen(false);

      const idx = DataManager.instance.accounts.findIndex(
        (v) => v.addr == selectOne.value
      );
      DataManager.instance.curAccount = idx;

      if (DataManager.instance.curMenu == "asset") {
        HttpManager.instance.getAsset(selectOne.value);
      } else if (DataManager.instance.curMenu == "transaction") {
        HttpManager.instance.getTransactions(selectOne.value);
      }
    }
  };

  const splitAccountsByChain = (accounts: AccountType[]) => {
    const groupedByChain = {};
    accounts.forEach((wallet) => {
      const { chain } = wallet;
      if (!groupedByChain[chain]) {
        groupedByChain[chain] = [];
      }
      groupedByChain[chain].push(wallet);
    });
    setWalletData(groupedByChain);
    return groupedByChain;
  };

  React.useEffect(() => {
    EventManager.instance.subscribe(
      EventType.team_switcher_reload,
      reloadGroup
    );

    return () => {
      EventManager.instance.unsubscribe(
        EventType.team_switcher_reload,
        reloadGroup
      );
    };
  }, []);

  React.useEffect(() => {
    const disposer = autorun(() => {
      splitAccountsByChain(accountStore.accounts);
    });
    return () => disposer();
  }, []);

  const v = isTestNet();
  const [testNet, setTestNet] = React.useState(v);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a account"
          className="bg-primary008 ml-4 !border-white001 text-white001 relative rounded-full border-none font-SourceSanPro"
        >
          <Avatar className="mr-2 h-5 w-5">
            <AvatarImage
              src={`https://avatar.vercel.sh/${selectedTeam.value}.png`}
              alt={selectedTeam.label}
              className="grayscale"
            />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          {accountStore.currentAddress
            ? sortStr(accountStore.currentAddress, 6)
            : "add wallet"}
          <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            {import.meta.env.VITE_OpenTestNet != "1" ? (
              ""
            ) : (
              <CommandGroup key={"netswitch"}>
                <CommandItem
                  key={"mainnet"}
                  onSelect={() => {
                    chooseMainNet();
                    CkbHepler.newInstance();
                    setTestNet(false);

                    window.location.reload();
                  }}
                >
                  {"Mainnet"}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      testNet == false ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
                <CommandItem
                  key={"testnet"}
                  onSelect={() => {
                    chooseTestNet();
                    CkbHepler.newInstance();
                    setTestNet(true);

                    window.location.reload();
                  }}
                >
                  {"Testnet"}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      testNet == true ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              </CommandGroup>
            )}

            <CommandInput placeholder="Search account..." />
            <CommandEmpty>No account found.</CommandEmpty>
            {walletData &&
              Object.keys(walletData).map((v) => (
                <CommandGroup heading={v} key={v}>
                  {walletData[v].map((accounts) => (
                    <>
                      <CommandItem
                        key={accounts.address}
                        onSelect={() => {
                          accountStore.setCurrentAddress(accounts.address);
                          setOpen(false);
                        }}
                      >
                        <Avatar className="mr-2 h-5 w-5">
                          <AvatarImage
                            src={`/${v.toLocaleLowerCase()}.png`}
                            alt={v}
                          />
                          <AvatarFallback>SC</AvatarFallback>
                        </Avatar>
                        {sortStr(accounts.address, 6)}
                        <CheckIcon
                          className={cn(
                            "ml-auto h-4 w-4",
                            accountStore.currentAddress == accounts.address
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                      </CommandItem>
                      <div className="flex px-2 justify-between items-center h-24">
                        <QRCode
                          className="!h-24 !w-24"
                          value={accounts.address}
                        />
                        <div className="flex flex-col h-full items-center justify-center">
                          <div
                            className=" cursor-pointer h-[50%] flex items-center"
                            onClick={() => {
                              copyTextToClipboard(accounts.address);
                            }}
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                          <div
                            className=" cursor-pointer h-[50%] flex items-center"
                            onClick={() => {
                              console.log(1);
                              accountStore.removeAccount(accounts.address);
                            }}
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 15 15"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M13.3536 2.35355C13.5488 2.15829 13.5488 1.84171 13.3536 1.64645C13.1583 1.45118 12.8417 1.45118 12.6464 1.64645L1.64645 12.6464C1.45118 12.8417 1.45118 13.1583 1.64645 13.3536C1.84171 13.5488 2.15829 13.5488 2.35355 13.3536L13.3536 2.35355ZM2.03735 8.46678C2.17398 9.12619 2.66918 9.67103 3.33886 9.89338L2.57833 10.6539C1.80843 10.2534 1.23784 9.53693 1.05815 8.66967C0.999538 8.38681 0.999604 8.06004 0.999703 7.56313L0.999711 7.50001L0.999703 7.43689C0.999604 6.93998 0.999538 6.61321 1.05815 6.33035C1.29846 5.17053 2.2379 4.28039 3.4182 4.055C3.70687 3.99988 4.04134 3.99993 4.56402 4.00001L4.62471 4.00001H5.49971C5.77585 4.00001 5.99971 4.22387 5.99971 4.50001C5.99971 4.77615 5.77585 5.00001 5.49971 5.00001H4.62471C4.02084 5.00001 3.78907 5.00225 3.60577 5.03725C2.80262 5.19062 2.19157 5.78895 2.03735 6.53324C2.00233 6.70225 1.99971 6.91752 1.99971 7.50001C1.99971 8.08251 2.00233 8.29778 2.03735 8.46678ZM12.9621 6.53324C12.8255 5.87397 12.3304 5.32922 11.661 5.10679L12.4215 4.34631C13.1912 4.74686 13.7616 5.46323 13.9413 6.33035C13.9999 6.61321 13.9998 6.93998 13.9997 7.43688L13.9997 7.50001L13.9997 7.56314C13.9998 8.06005 13.9999 8.38681 13.9413 8.66967C13.701 9.8295 12.7615 10.7196 11.5812 10.945C11.2925 11.0001 10.9581 11.0001 10.4354 11L10.3747 11H9.49971C9.22357 11 8.99971 10.7762 8.99971 10.5C8.99971 10.2239 9.22357 10 9.49971 10H10.3747C10.9786 10 11.2104 9.99777 11.3937 9.96277C12.1968 9.8094 12.8079 9.21108 12.9621 8.46678C12.9971 8.29778 12.9997 8.08251 12.9997 7.50001C12.9997 6.91752 12.9971 6.70225 12.9621 6.53324Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </>
                  ))}
                </CommandGroup>
              ))}
          </CommandList>
          <CommandSeparator />
        </Command>
      </PopoverContent>
    </Popover>
  );
});

export default TeamSwitcher;
