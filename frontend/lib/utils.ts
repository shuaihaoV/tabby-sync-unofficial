import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertUTCToLocalTime(dateString: string): string {
  // 创建一个新的 Date 对象
  const date = new Date(dateString);

  // 使用本地时间和日期选项格式化日期
  const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
  };
  const locale = new Intl.DateTimeFormat().resolvedOptions().locale;

  // 使用本地时区和给定的选项格式化日期
  const formatter = new Intl.DateTimeFormat(locale, options);
  const parts = formatter.formatToParts(date);

  // 构建日期字符串
  const result = `${parts.find(part => part.type === 'year')?.value}-${parts.find(part => part.type === 'month')?.value}-${parts.find(part => part.type === 'day')?.value} ${parts.find(part => part.type === 'hour')?.value}:${parts.find(part => part.type === 'minute')?.value}:${parts.find(part => part.type === 'second')?.value}`;

  return result;
}