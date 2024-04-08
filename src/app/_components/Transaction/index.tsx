import Image from "next/image";
import {
  Copy,
  ChevronRight,
  CircleArrowOutUpRight,
  CircleArrowOutDownLeft,
  ExternalLink,
} from "lucide-react";

export enum TRANSACTION_TYPE {
  SEND,
  RECEIVE,
}

const TokenBlock = ({
  amount,
  type,
}: {
  amount: number | string;
  type: TRANSACTION_TYPE;
}) => {
  return (
    <div className="flex items-center gap-2">
      <Image
        width={32}
        height={32}
        src="/img/btc.png"
        alt="USDT"
        className="w-8 h-8 rounded-full object-cover min-w-[2rem]"
      />
      <div className="">
        {type === TRANSACTION_TYPE.RECEIVE ? (
          <div className="text-lime-600">+{amount}</div>
        ) : (
          <div className="text-red-600">-{amount}</div>
        )}
        <div className="text-slate-300">SUDT</div>
      </div>
    </div>
  );
};

const AccountBlock = () => {
  return (
    <div className="flex items-center gap-2">
      <Image
        width={32}
        height={32}
        src="/img/btc.png"
        alt=""
        className="w-8 h-8 rounded-full object-cover min-w-[2rem]"
      />
      <div className="">
        <span>To</span>
        <div className="text-slate-300">0x00000</div>
      </div>
    </div>
  );
};

const ReceiveBlock = ({ amount }: { amount: number | string }) => {
  return (
    <div className="flex sm:flex-1 sm:justify-start items-center space-x-2 sm:space-x-4">
      <TokenBlock amount={amount} type={TRANSACTION_TYPE.RECEIVE} />
      <div className="mx-1 sm:mx-2 text-sm">
        <ChevronRight />
      </div>
      <AccountBlock />
    </div>
  );
};

const SendBlock = ({ amount }: { amount: number | string }) => {
  return (
    <div className="flex sm:flex-1 sm:justify-start items-center space-x-2 sm:space-x-4">
      <AccountBlock />
      <div className="mx-1 sm:mx-2 text-sm">
        <ChevronRight />
      </div>
      <TokenBlock amount={amount} type={TRANSACTION_TYPE.SEND} />
    </div>
  );
};

interface ITransactionItemProps {
  type: TRANSACTION_TYPE;
  amount: number | string;
  token: any;
}

export default function TransactionItem({
  type,
  amount,
  token,
}: ITransactionItemProps) {
  return (
    <div className="hover:bg-primary010 cursor-pointer p-4 sm:border-b last:border-none border-gray-500">
      <div className="flex items-center">
        <div className="relative rounded-full flex w-8 h-8 items-center justify-center">
          {type === TRANSACTION_TYPE.SEND ? (
            <CircleArrowOutUpRight />
          ) : (
            <CircleArrowOutDownLeft />
          )}
        </div>
        <div className="overflow-y-visible overflow-x-auto sm:overflow-x-visible whitespace-nowrap text-ellipsis flex flex-wrap flex-1 justify-between lg:grid grid-cols-12 gap-4 lg:gap-5 xl:gap-6 items-center pl-4">
          <div className="flex items-center space-x-4 col-span-4 2xl:col-span-3">
            <div className="flex md:block">
              <div className="font-semibold whitespace-nowrap">
                {type === TRANSACTION_TYPE.SEND ? "Send" : "Receive"}
              </div>
              <div className="ml-4 sm:ml-0 text-slate-300 whitespace-nowrap">
                03:41 pm
              </div>
            </div>
            <div className="flex items-center text-slate-300 space-x-1 hover:bg-slate-600 rounded-full">
              <button className="p-2 items-center flex cursor-pointer w-fit">
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div className="col-span-7 2xl:col-span-5 sm:flex-1 hidden lg:flex truncate">
            {type === TRANSACTION_TYPE.SEND ? (
              <SendBlock amount={amount} />
            ) : (
              <ReceiveBlock amount={amount} />
            )}
          </div>
          <div className="flex items-center justify-end space-x-2 col-span-1 2xl:col-span-2">
            <a
              href="http://"
              className="text-slate-400 hover:bg-slate-600 p-2 rounded-full flex"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={20} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
