import { Copy } from "lucide-react";

export default function Transaction() {
  return (
    <main className="flex flex-col flex-1 h-full bg-primary008 text-white001">
      <div className="pb-10 md:mx-4 my-4 lg:mx-8 lg:my-0 h-full flex flex-col">
        <div className=" text-hd1mb w-full py-4 px-4 font-Montserrat my-4">
          Transaction
        </div>
        <div className="w-full flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <div className="top-0 font-medium text-sm py-4">
            <div className="text-sm text-subdued mb-2">August 26, 2023</div>
            <Send />
          </div>
          <div className="top-0 font-medium text-sm py-4">
            <div className="text-sm text-subdued mb-2">August 26, 2023</div>
            <Send />
            <Send />
            <Send />
          </div>
        </div>
      </div>
    </main>
  );
}

const TokenBlock = () => {};

const Send = () => {
  return (
    <div className="py-4 -mx-4 sm:-mx-6 px-4 sm:px-6 hover:bg-primary010 cursor-pointer">
      <div className="flex items-center">
        <div className="relative rounded-full flex w-8 h-8 items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="w-4 h-4 text-subdued"
          >
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
          </svg>
        </div>
        <div className="overflow-y-visible overflow-x-auto sm:overflow-x-visible whitespace-nowrap text-ellipsis md:flex flex-wrap flex-1 md:justify-between lg:grid grid-cols-12 gap-4 lg:gap-5 xl:gap-6 items-center sm:pl-4">
          <div className="flex items-center space-x-4 mb-1 sm:mb-0 col-span-4 2xl:col-span-3">
            <div className="flex md:block mb-1 sm:mb-0">
              <div className="font-semibold whitespace-nowrap">Send</div>
              <div className="ml-4 sm:ml-0 text-slate-300 whitespace-nowrap">
                03:41 pm
              </div>
            </div>
            <div className="flex items-center text-slate-300 space-x-1">
              <button className="p-1.5 rounded-md items-center flex cursor-pointer w-fit">
                <Copy />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
