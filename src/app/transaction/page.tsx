"use client";

import TransactionItem, { TRANSACTION_TYPE } from "../_components/Transaction";

export default function Transaction() {
  return (
    <main className="flex flex-col flex-1 h-full bg-primary008 text-white001">
      <div className="pb-10 h-full w-full flex flex-col">
        <div className="md:mx-4 lg:mx-8 text-hd1mb py-4 px-4 font-Montserrat my-4">
          Transaction
        </div>
        <div className="w-full flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="top-0 font-medium text-sm py-4">
            <div className="px-4 text-sm text-subdued mb-2">
              August 26, 2023
            </div>
            <TransactionItem
              type={TRANSACTION_TYPE.SEND}
              amount={0.0001}
              token=""
            />
          </div>
          <div className="top-0 font-medium text-sm py-4">
            <div className="px-4 text-sm text-subdued mb-2">
              August 26, 2023
            </div>
            <TransactionItem
              type={TRANSACTION_TYPE.SEND}
              amount={0.0001}
              token=""
            />
            <TransactionItem
              type={TRANSACTION_TYPE.RECEIVE}
              amount={0.0001}
              token=""
            />
            <TransactionItem
              type={TRANSACTION_TYPE.RECEIVE}
              amount={0.0001}
              token=""
            />
          </div>
        </div>
      </div>
    </main>
  );
}
