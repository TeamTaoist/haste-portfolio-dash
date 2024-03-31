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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataManager } from "@/lib/manager/DataManager";
import { HttpManager } from "@/lib/api/HttpManager";
import { EventManager } from "@/lib/manager/EventManager";
import { EventType } from "@/lib/enum";
import { observer } from "mobx-react";
import { accountStore, AccountType } from "@/store/AccountStore";
import { autorun } from "mobx";

let groups: { label: string; teams: { label: string; value: string }[] }[] = [];

type Team = (typeof groups)[number]["teams"][number];

const TeamSwitcher = observer(() => {
  const [open, setOpen] = React.useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);
  const [walletData, setWalletData] = React.useState<Record<string, AccountType[]>>();

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
      if (team.value == curAccount.addr) {
        curTeam = team;
        findFlag = true;
        break;
      }
    }
    if (findFlag) break;
  }

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
      accounts.forEach(wallet => {
      const { chain } = wallet;
      if (!groupedByChain[chain]) {
        groupedByChain[chain] = [];
      }
      groupedByChain[chain].push(wallet);
    });
    setWalletData(groupedByChain);
    return groupedByChain
  }

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
      splitAccountsByChain(accountStore.accounts)
    })
    return () => disposer();
  }, [])

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
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
            {sortStr(selectedTeam.label, 6)}
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search account..." />
              <CommandEmpty>No account found.</CommandEmpty>
              {
                walletData && Object.keys(walletData).map(v => 
                  <CommandGroup heading={v} key={v}> 
                    {walletData[v].map(accounts => 
                      <CommandItem
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
                      </CommandItem>)}
                  </CommandGroup>)
              }
            </CommandList>
            <CommandSeparator />
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Add a new team to manage products and customers.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team name</Label>
              <Input id="name" placeholder="Acme Inc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Subscription plan</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <span className="font-medium">Free</span> -{" "}
                    <span className="text-muted-foreground">
                      Trial for two weeks
                    </span>
                  </SelectItem>
                  <SelectItem value="pro">
                    <span className="font-medium">Pro</span> -{" "}
                    <span className="text-muted-foreground">
                      $9/month per user
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
            Cancel
          </Button>
          <Button type="submit">Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
})

export default TeamSwitcher