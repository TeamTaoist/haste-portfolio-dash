"use client";

import { useState } from "react";
import EmptyImage from "../common/Empty/image";

export default function SporeList() {
  const [spores] = useState(new Array(100).fill(0));
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 xl:gap-x-8 text-white">
      {spores.map((_, index) => (
        <div
          key={index}
          className="relative translate-y-0 hover:z-10 hover:shadow-2xl hover:-translate-y-0.5 bg-inherit rounded-lg shadow-xl transition-all cursor-pointer group border border-gray-500"
        >
          <div className="flex shrink-0 aspect-square rounded-t-md overflow-hidden items-center bg-primary011 ">
            {Math.round(Math.random()) % 2 === 0 ? (
              <img
                src="https://img.reservoir.tools/images/v2/polygon/hc%2BnPcLmWxs%2FDW99DlBQ42k40ZoyYV5jCIms5qHjwvuJ0YcFQ9C1r6S71lSDSuimxWvQT3aWXuWUieWJXqV9xtJ3mLYRXHCS%2FKnL6XlVQXPtnCacxwAonWizJmF9iXI4V3FKXdlFlxHSvbstd697Qtr6Gnv1HtK%2BeOwoXx8ZP5EO99xEAkOYV%2BCdaZx%2FBGYw?width=512"
                alt=""
                className="w-full object-cover block"
              />
            ) : (
              <div className="flex h-full w-full justify-center items-center text-slate-300">
                <EmptyImage className="h-full w-full max-w-[5rem] max-h-[5rem]" />
              </div>
            )}
          </div>
          <div className="p-3">0x00000000</div>
        </div>
      ))}
    </div>
  );
}
