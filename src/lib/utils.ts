import { BI, Cell, Script, helpers } from "@ckb-lumos/lumos";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Buffer } from 'buffer/';

import {
  PERSONAL,
  blake2b,
  hexToBytes,
  serializeInput,
} from "@nervosnetwork/ckb-sdk-utils";
import { u64ToLe, u8ToHex, utf8ToHex } from "@rgbpp-sdk/ckb";
import { assetInfoMgr } from "./manager/AssetInfoManager";
import {
  FIXED_SIZE,
  mainConfig,
  testConfig,
} from "./wallet/constants";
import { getEnv } from "../settings/env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sortStr(input: string | null | undefined, len: number) {
  if (!input) {
    return "...";
  }

  return (
    input.substring(0, len) +
    "..." +
    input.substring(input.length - len, input.length)
  );
}

export function checkInterface<T>(obj: any, str: string): obj is T {
  return obj["kind"] == str;
}

export const remove0x = (hex: string): string => {
  if (hex.startsWith("0x")) {
    return hex.substring(2);
  }
  return hex;
};

export const append0x = (hex?: string): string => {
  return hex?.startsWith("0x") ? hex : `0x${hex}`;
};

// minimum occupied capacity and 1 ckb for transaction fee
// assume UDT cell data size is 16bytes
export const calculateUdtCellCapacity = (lock: Script, udtType: Script): BI => {
  const lockArgsSize = remove0x(lock.args).length / 2;
  const typeArgsSize = remove0x(udtType.args).length / 2;
  const cellSize = 33 + lockArgsSize + 33 + typeArgsSize + 8 + 16;
  //@ts-ignore
  return parseUnit(cellSize + 1 + "", "ckb");
};

// minimum occupied capacity and 1 ckb for transaction fee
export const calculateNFTCellCapacity = (lock: Script, cell: Cell): BI => {
  const lockArgsSize = remove0x(lock.args).length / 2;
  const cellDataSize = remove0x(cell.data).length / 2;
  let cellSize = 33 + lockArgsSize + 8 + cellDataSize;

  if (cell.cellOutput.type) {
    const typeArgsSize = remove0x(cell.cellOutput.type.args).length / 2;
    cellSize += 33 + typeArgsSize;
  }
  //@ts-ignore
  return parseUnit(cellSize + 1 + "", "ckb");
};

export const calculateEmptyCellMinCapacity = (lock: Script): BI => {
  const lockArgsSize = remove0x(lock.args).length / 2;
  const cellSize = 33 + lockArgsSize + 8;
  //@ts-ignore
  return parseUnit(cellSize + 1 + "", "ckb");
};

export const calculateTransactionFee = (txSize: number): BI => {
  const ratio = BI.from(1000);
  const defaultFeeRate = BI.from(1100);
  const fee = BI.from(txSize).mul(defaultFeeRate).div(ratio);
  return fee;
};


export const generateInscriptionId = (
  firstInput: CKBComponents.CellInput,
  outputIndex: number
) => {
  const input = hexToBytes(serializeInput(firstInput));
  const s = blake2b(32, null, null, PERSONAL);
  s.update(input);
  s.update(hexToBytes(`0x${u64ToLe(BigInt(outputIndex))}`));
  return `0x${s.digest("hex")}`;
};

export const serializeInscriptionXudtInfo = (info: {
  decimal: number;
  name: string;
  symbol: string;
  xudtHash: string;
}) => {
  let ret = u8ToHex(info.decimal);
  const name = remove0x(utf8ToHex(info.name));
  ret = ret.concat(u8ToHex(name.length / 2) + name);
  const symbol = remove0x(utf8ToHex(info.symbol));
  ret = ret.concat(u8ToHex(symbol.length / 2) + symbol);
  ret = ret.concat(remove0x(info.xudtHash));
  return ret;
};

export const getSymbol = async (udtTypeScript?: Script) => {
  if (!udtTypeScript) return "...";
  const info = await assetInfoMgr.getXUDTInfo(udtTypeScript);
  return info ? info.symbol : "...";
};

export const unserializeTokenInfo = (hexData: string) => {
  const buf = hexToBytes(hexData);
  const view = new DataView(buf.buffer);

  const decimal = view.getUint8(0);

  const nameLen = view.getUint8(1);

  let header = 2;
  const nameMax = header + nameLen;
  const nameBuf = new ArrayBuffer(nameLen);
  const nameView = new DataView(nameBuf);
  for (let i = 0; header < nameMax; header++, i++) {
    const v = view.getUint8(header);
    nameView.setUint8(i, v);
  }

  const symbolLen = view.getUint8(header);
  header++;
  const symbolMax = header + symbolLen;
  const symbolBuf = new ArrayBuffer(symbolLen);
  const symbolView = new DataView(symbolBuf);
  for (let i = 0; header < symbolMax; header++, i++) {
    const v = view.getUint8(header);
    symbolView.setUint8(i, v);
  }

  console.log(
    decimal,
    Buffer.from(nameBuf).toString(),
    Buffer.from(symbolBuf).toString()
  );

  return {
    decimal,
    name: Buffer.from(nameBuf).toString(),
    symbol: Buffer.from(symbolBuf).toString(),
  };
};

export const calcUniqueCellInfoCapacity = (
  address: string,
  info: {
    decimal: number;
    name: string;
    symbol: string;
  }
) => {
  const cfg = getEnv() === 'Testnet' ? testConfig : mainConfig;

  const lock = helpers.parseAddress(address, {
    config: cfg.CONFIG,
  });
  const argsSize = hexToBytes(lock.args).length;
  const lockSize = 32 + 1 + argsSize;
  const inscriptionInfoTypeSize = 32 + 32 + 1;
  const capacitySize = 8;
  const infoDataSize = calcInscriptionInfoSize(info);
  const cellSize =
    lockSize + inscriptionInfoTypeSize + capacitySize + infoDataSize;
  return BigInt(cellSize) * BigInt(10000_0000);
};

export const calcInscriptionInfoSize = (info: {
  decimal: number;
  name: string;
  symbol: string;
}) => {
  let size = FIXED_SIZE;
  const name = remove0x(utf8ToHex(info.name));
  size += name.length / 2 + 1;
  const symbol = remove0x(utf8ToHex(info.symbol));
  size += symbol.length / 2 + 1;
  return size;
};

export const calcXudtCapacity = (lock: CKBComponents.Script): bigint => {
  const argsSize = hexToBytes(lock.args).length;
  const lockSize = 32 + 1 + argsSize;
  const xudtTypeSize = 32 + 32 + 1;
  const capacitySize = 8;
  const xudtDataSize = 16;
  const cellSize = lockSize + xudtTypeSize + capacitySize + xudtDataSize;
  return BigInt(cellSize) * BigInt(10000_0000);
};

export const serializeUniqueCellXudtInfo = (info: {
  decimal: number;
  name: string;
  symbol: string;
}) => {
  let ret = u8ToHex(info.decimal);
  const name = remove0x(utf8ToHex(info.name));
  ret = ret.concat(u8ToHex(name.length / 2) + name);
  const symbol = remove0x(utf8ToHex(info.symbol));
  ret = ret.concat(u8ToHex(symbol.length / 2) + symbol);
  return ret;
};

export const generateUniqueTypeArgs = (
  firstInput: CKBComponents.CellInput,
  firstOutputIndex: number
) => {
  const input = hexToBytes(serializeInput(firstInput));
  const s = blake2b(32, null, null, PERSONAL);
  s.update(input);
  s.update(hexToBytes(`0x${u64ToLe(BigInt(firstOutputIndex))}`));
  return `0x${s.digest("hex").slice(0, 40)}`;
};
