export function formatString(str: string, unit: number): string {
  if (str.length <= (unit * 2)) {
    return str;
  }
  const start: string = str.substring(0, unit);
  const end: string = str.substring(str.length - unit);
  return `${start}*****${end}`;
}