import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 * This utility combines clsx for conditional classes and tailwind-merge
 * to properly handle Tailwind class conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an Ethereum address for display
 * @param address - Full Ethereum address
 * @param chars - Number of characters to show on each end
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a bigint value as a human-readable token amount
 * @param value - The value in wei
 * @param decimals - Token decimals (default 18)
 * @param displayDecimals - How many decimals to show
 */
export function formatTokenAmount(
  value: bigint,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = value / divisor;
  const fractionalPart = value % divisor;
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const displayFractional = fractionalStr.slice(0, displayDecimals);
  
  // Remove trailing zeros
  const trimmedFractional = displayFractional.replace(/0+$/, '');
  
  if (trimmedFractional) {
    return `${integerPart.toLocaleString()}.${trimmedFractional}`;
  }
  return integerPart.toLocaleString();
}

/**
 * Parse a human-readable token amount to bigint
 * @param amount - Human-readable amount (e.g., "1.5")
 * @param decimals - Token decimals (default 18)
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  const [integerPart, fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integerPart + paddedFractional);
}

/**
 * Format a timestamp (in milliseconds) to a human-readable date
 */
export function formatDate(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp (in milliseconds) to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(timestampMs: number): string {
  const diff = Date.now() - timestampMs;
  
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} minutes ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hours ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} days ago`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 604_800_000)} weeks ago`;
  
  return formatDate(timestampMs);
}

/**
 * Format time remaining until a deadline (in milliseconds)
 */
export function formatTimeRemaining(deadlineMs: number): string {
  const diff = deadlineMs - Date.now();
  
  if (diff <= 0) return 'Expired';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} minutes left`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hours left`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} days left`;
  
  return `${Math.floor(diff / 604_800_000)} weeks left`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
