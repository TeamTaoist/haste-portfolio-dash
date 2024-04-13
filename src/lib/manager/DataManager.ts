// import { accountStore } from "@/store/AccountStore";
import {
  AccountData,
  AssetInfo,
  RgbAssert,
  WalletInfo,
  tokensInfo,
  txInfo,
} from "../interface";
import store from "@/store/store";

export class DataManager {
  private static _instance: DataManager;
  private constructor() {
    this._accounts = [];
  }

  public static get instance() {
    if (!DataManager._instance) {
      DataManager._instance = new DataManager();
    }
    return this._instance;
  }

  public getCurAccount() {

    return store.getState().wallet.currentWalletAddress;
  }

  private _accounts: AccountData[] = [];
  public get accounts(): AccountData[] {
    return this._accounts;
  }
  public set accounts(v: AccountData[]) {
    this._accounts = v;
  }

  private _curAccount: number = 0;
  public get curAccount(): number {
    return this._curAccount;
  }
  public set curAccount(v: number) {
    this._curAccount = v;
  }

  private _curAsset: AssetInfo[] = [];
  public get curAsset(): AssetInfo[] {
    return this._curAsset;
  }
  public set curAsset(v: AssetInfo[]) {
    this._curAsset = v;
  }

  private _curMenu: string = "asset";
  public get curMenu(): string {
    return this._curMenu;
  }
  public set curMenu(v: string) {
    this._curMenu = v;
  }

  private _curTxList: txInfo[] = [];
  public get curTxList(): txInfo[] {
    return this._curTxList;
  }
  public set curTxList(v: txInfo[]) {
    this._curTxList = v;
  }

  private _tokens: tokensInfo = {
    udt: [],
    spore: [],
  };
  public get tokens(): tokensInfo {
    return this._tokens;
  }
  public set tokens(v: tokensInfo) {
    this._tokens = v;
  }

  private _curPath: string = "";
  public get curPath(): string {
    return this._curPath;
  }
  public set curPath(v: string) {
    this._curPath = v;
  }

  private _joyIdConnectionType: string = "";
  public get joyIdConnectionType(): string {
    return this._joyIdConnectionType;
  }
  public set joyIdConnectionType(v: string) {
    this._joyIdConnectionType = v;
  }

  private _walletInfo: { [key: string]: WalletInfo } = {};
  public get walletInfo(): { [key: string]: WalletInfo } {
    return this._walletInfo;
  }
  public set walletInfo(v: { [key: string]: WalletInfo }) {
    this._walletInfo = v;
  }

  private _curRgbAssert: RgbAssert[] = [];
  public get curRgbAssert(): RgbAssert[] {
    return this._curRgbAssert;
  }
  public set curRgbAssert(v: RgbAssert[]) {
    this._curRgbAssert = v;
  }
}
