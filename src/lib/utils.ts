import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sortStr(input: string, len: number) {
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
