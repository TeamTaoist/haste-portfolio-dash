import { isTestNet } from "@/lib/wallet/constants";
import { makeAutoObservable } from "mobx";

export interface AccountType {
  address: string;
  pubkey: string;
  type: string;
  chain: string;
  keyType?: string;
}

class AccountStore {
  accounts: AccountType[] = [];
  currentAddress: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadAccounts();
  }

  loadAccounts() {
    const isTest = isTestNet();

    const accountsFromStorage = localStorage.getItem(
      isTest ? "testAccounts" : "mainAccounts"
    );
    if (accountsFromStorage) {
      this.accounts = JSON.parse(accountsFromStorage);
      this.setCurrentAddress(
        this.accounts[0] && this.accounts[0].address
          ? this.accounts[0].address
          : ""
      );
    }
  }

  saveAccounts() {
    const isTest = isTestNet();

    localStorage.setItem(
      isTest ? "testAccounts" : "mainAccounts",
      JSON.stringify(this.accounts)
    );
  }

  addAccount(account: AccountType) {
    const index = this.accounts.findIndex(
      (existingAccount) => existingAccount.address === account.address
    );
    if (index === -1) {
      this.accounts.push(account);
      this.saveAccounts();
    }
  }

  removeAccount(address: string) {
    const index = this.accounts.findIndex(
      (account) => account.address === address
    );
    if (index > -1) {
      this.accounts.splice(index, 1);
      this.saveAccounts();
    }
  }

  setCurrentAddress(address: string) {
    const exists = this.accounts.some((account) => account.address === address);
    if (exists) {
      this.currentAddress = address;
    }
  }

  totalAddress() {
    return this.accounts.length;
  }

  getWallet(address) {
    const exists = this.accounts.find((account) => account.address === address);
    if (exists) {
      return exists;
    }
  }
}

export const accountStore = new AccountStore();
