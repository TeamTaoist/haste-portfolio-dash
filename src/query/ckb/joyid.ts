import { bytes } from "@ckb-lumos/codec";
import * as blockchain from "@ckb-lumos/base/lib/blockchain";
import {
  WitnessArgs,
  commons,
  helpers,
  Script,
  Cell,
  utils,
  CellDep,
} from "@ckb-lumos/lumos";
import type * as api from "@ckb-lumos/base";
import {
  getJoyIDLockScript,
  getJoyIDCellDep,
  Aggregator,
  getConfig,
  // connect,
} from "@joyid/ckb";
import { addCellDep } from "@ckb-lumos/common-scripts/lib/helper";
import store from "../../store/store";

const isMainnet = false;

export interface CellCollector {
  collect(): AsyncIterable<Cell>;
}

export interface CellProvider {
  uri?: string;
  collector(queryOptions: api.QueryOptions): CellCollector;
}

class JoyIDCellCollector {
  readonly fromScript: Script;
  private readonly cellCollector: CellCollector;

  constructor(
    fromAddr: any,
    cellProvider: CellProvider,
    { queryOptions = {} }: any
  ) {
    if (!cellProvider) {
      throw new Error(
        `cellProvider is required when collecting JoyID-related cells`
      );
    }

    this.fromScript = helpers.parseAddress(fromAddr);

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
      type: queryOptions.type || "empty",
    };

    this.cellCollector = cellProvider.collector(queryOptions);
  }

  async *collect(): AsyncGenerator<Cell> {
    for await (const inputCell of this.cellCollector.collect()) {
      yield inputCell;
    }
  }
}

// type Connection = Awaited<ReturnType<typeof connect>>;

export function createJoyIDScriptInfo(): commons.LockScriptInfo {
  return {
    codeHash: getJoyIDLockScript(isMainnet).codeHash,
    hashType: "type",
    lockScriptInfo: {
      CellCollector: JoyIDCellCollector,
      prepareSigningEntries: (txSkeleton) => txSkeleton,
      async setupInputCell(txSkeleton, inputCell, _, options = {}) {
        const template = getJoyIDLockScript(isMainnet);

        const fromScript = inputCell.cellOutput.lock;
        asserts(
          bytes.equal(fromScript.codeHash, template.codeHash),
          `The input script is not JoyID script`
        );
        // add inputCell to txSkeleton
        txSkeleton = txSkeleton.update("inputs", (inputs) =>
          inputs.push(inputCell)
        );

        if (inputCell.cellOutput.capacity != "0x0") {
          const output: Cell = {
            cellOutput: {
              capacity: inputCell.cellOutput.capacity,
              lock: inputCell.cellOutput.lock,
              type: inputCell.cellOutput.type,
            },
            data: inputCell.data,
          };

          txSkeleton = txSkeleton.update("outputs", (outputs) => {
            return outputs.push(output);
          });
        }

        const since = options.since;
        if (since) {
          txSkeleton = txSkeleton.update("inputSinces", (inputSinces) => {
            return inputSinces.set(txSkeleton.get("inputs").size - 1, since);
          });
        }

        if (!template) {
          throw new Error(`JoyID script not defined in config!`);
        }

        // add witness
        /*
         * Modify the skeleton, so the first witness of the fromAddress script group
         * has a WitnessArgs construct with 85-byte zero filled values. While this
         * is not required, it helps in transaction fee estimation.
         */
        const firstIndex = txSkeleton
          .get("inputs")
          .findIndex((input) =>
            bytes.equal(
              blockchain.Script.pack(input.cellOutput.lock),
              blockchain.Script.pack(fromScript)
            )
          );
        if (firstIndex !== -1) {
          while (firstIndex >= txSkeleton.get("witnesses").size) {
            txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
              witnesses.push("0x")
            );
          }

          // const connection = config.connection;
          const walletAddr = store.getState().wallet.currentWalletAddress;
          const wallets = store.getState().wallet.wallets;
          if (!walletAddr) {
            throw new Error("[joyid] No wallet addr");
          }
          const wallet = wallets.find(wallet => wallet.address === walletAddr);
          if (!wallet) {
            throw new Error("[joyid] No wallet");
          }
          console.log("JoyID config: ", getConfig());
          // console.log("JoyID connection: ", connection);

          const lock = helpers.parseAddress(wallet.address);

          // will change if the connection.keyType is a sub_key
          let newWitnessArgs: WitnessArgs = {
            lock: "0x",
          };

          txSkeleton = addCellDep(txSkeleton, getJoyIDCellDep(false));

          const witness = bytes.hexify(
            blockchain.WitnessArgs.pack(newWitnessArgs)
          );
          txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
            witnesses.set(firstIndex, witness)
          );
        }

        return txSkeleton;
      },
    },
  };
}

function asserts(
  condition: unknown,
  message = "Assert failed"
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
