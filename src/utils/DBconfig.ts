export const DBConfig = {
    name: "MyDB",
    version: 1,
    objectStoresMeta: [
        {
            store: "records",
            storeConfig: { keyPath: "id", autoIncrement: true },
            storeSchema: [
                { name: "txHash", keypath: "txHash", options: { unique: true } },
                { name: "timestamp", keypath: "timestamp", options: { unique: false } },
                { name: "status", keypath: "status", options: { unique: false } },
            ],
        },
    ],
};
