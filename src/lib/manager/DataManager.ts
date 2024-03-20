import {
  AccountData,
  AssetInfo,
  WalletType,
  tokensInfo,
  txInfo,
} from "../interface";

export class DataManager {
  private static _instance: DataManager;
  private constructor() {
    // test
    this._accounts = [
      {
        chain: "BTC",
        addr: "3AbdWZYCxoDEixW8rxB4rTDxGVGLR7DM25",
      },
      {
        chain: "CKB",
        addr: "ckt1qrejnmlar3r452tcg57gvq8patctcgy8acync0hxfnyka35ywafvkqgpes90ptu3rh2qs5acer07ay9n97x3ajkkqqnm062a",
      },
      {
        chain: "CKB",
        addr: "ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqx7nj3mf8kj4m5p9gnwl7mlfttujm2wgnuqmprl9",
      },
    ];
  }

  public static get instance() {
    if (!DataManager._instance) {
      DataManager._instance = new DataManager();
    }
    return this._instance;
  }

  public getCurAccount() {
    return this._accounts[this._curAccount];
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

  private _curLiveCells: number = 0;
  public get curLiveCells(): number {
    return this._curLiveCells;
  }
  public set curLiveCells(v: number) {
    this._curLiveCells = v;
  }

  private _curPath: string = "";
  public get curPath(): string {
    return this._curPath;
  }
  public set curPath(v: string) {
    this._curPath = v;
  }

  private _curWalletType: WalletType = "none";
  public get curWalletType(): WalletType {
    return this._curWalletType;
  }
  public set curWalletType(v: WalletType) {
    this._curWalletType = v;
  }

  private _curWalletAddr: string = "";
  public get curWalletAddr(): string {
    return this._curWalletAddr;
  }
  public set curWalletAddr(v: string) {
    this._curWalletAddr = v;
  }
}
