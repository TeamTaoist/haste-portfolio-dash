import { BI, Cell, Script } from "@ckb-lumos/lumos";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseUnit } from "@ckb-lumos/bi";
import {
  assembleTransferSporeAction,
  assembleCobuildWitnessLayout,
} from "@spore-sdk/core/lib/cobuild";
import {
  PERSONAL,
  blake2b,
  hexToBytes,
  serializeInput,
} from "@nervosnetwork/ckb-sdk-utils";
import { u64ToLe, u8ToHex, utf8ToHex } from "@rgbpp-sdk/ckb";
import { assetInfoMgr } from "./manager/AssetInfoManager";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  return parseUnit(cellSize + 1 + "", "ckb");
};

// minimum occupied capacity and 1 ckb for transaction fee
export const calculateEmptyCellMinCapacity = (lock: Script): BI => {
  const lockArgsSize = remove0x(lock.args).length / 2;
  const cellSize = 33 + lockArgsSize + 8;
  return parseUnit(cellSize + 1 + "", "ckb");
};

export const calculateTransactionFee = (txSize: number): BI => {
  const ratio = BI.from(1000);
  const defaultFeeRate = BI.from(1100);
  const fee = BI.from(txSize).mul(defaultFeeRate).div(ratio);
  return fee;
};

export const generateSporeCoBuild = (
  sporeCells: Cell[],
  inputCellOutPut: {
    capacity: string;
    lock: Script;
    type?: Script;
  }[]
): string => {
  if (sporeCells.length !== inputCellOutPut.length) {
    throw new Error(
      "The length of spore input cells length and spore output cells are not same"
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sporeActions: any[] = [];
  for (let index = 0; index < sporeCells.length; index++) {
    const sporeCell = sporeCells[index];
    const outputData = sporeCell.data;
    const sporeInput = {
      cellOutput: inputCellOutPut[index],
      data: outputData,
    };
    const sporeOutput = {
      cellOutput: sporeCells[index].cellOutput,
      data: outputData,
    };
    const { actions } = assembleTransferSporeAction(sporeInput, sporeOutput);
    sporeActions = sporeActions.concat(actions);
  }
  return assembleCobuildWitnessLayout(sporeActions);
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

export const getSymbol = (udtTypeScript: Script) => {
  const info = assetInfoMgr.getXUDTInfo(udtTypeScript);

  return info ? info.symbol : "...";
};
