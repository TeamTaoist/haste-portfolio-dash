import { config, hd, helpers } from "@ckb-lumos/lumos";
const { mnemonic, ExtendedPrivateKey, AddressType } = hd;

export class AddressHelper {
  private static _instance: AddressHelper;
  private constructor() {}

  public static get instance() {
    if (!AddressHelper._instance) {
      AddressHelper._instance = new AddressHelper();
    }
    return this._instance;
  }

  generateFirstHDPrivateKey = () => {
    const myMnemonic = mnemonic.generateMnemonic();
    const seed = mnemonic.mnemonicToSeedSync(myMnemonic);
    console.log("my mnemonic ", seed);

    const extendedPrivKey = ExtendedPrivateKey.fromSeed(seed);
    return extendedPrivKey.privateKeyInfo(AddressType.Receiving, 0).privateKey;
  };

  getTestAddressByPrivateKey = (privateKey: string) => {
    const args = hd.key.privateKeyToBlake160(privateKey);
    const template = config.predefined.AGGRON4.SCRIPTS["SECP256K1_BLAKE160"]!;
    const lockScript = {
      codeHash: template.CODE_HASH,
      hashType: template.HASH_TYPE,
      args: args,
    };

    return helpers.encodeToAddress(lockScript, {
      config: config.predefined.AGGRON4,
    });
  };

  getMainAddressByPrivateKey = (privateKey: string) => {
    const args = hd.key.privateKeyToBlake160(privateKey);
    const template = config.predefined.LINA.SCRIPTS["SECP256K1_BLAKE160"]!;
    const lockScript = {
      codeHash: template.CODE_HASH,
      hashType: template.HASH_TYPE,
      args: args,
    };

    return helpers.encodeToAddress(lockScript, {
      config: config.predefined.LINA,
    });
  };
}
