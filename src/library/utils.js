/**
 * Standard number formatting with full locale support.
 * Examples: 
 * formatNumber(150000, 'en-US') -> "150,000" (North America)
 * formatNumber(150000, 'de-DE') -> "150.000" (European)
 * formatNumber(150000, 'en-IN') -> "1,50,000" (Indian Lakhs)
 */
export function formatNumber(number, locale = 'en-US') {
  if (number === null || number === undefined || isNaN(number)) return '0';
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Compact number formatting (e.g., 1.5K, 2.3M, 1.2B)
 * Also respects locales!
 */
export function formatCompactNumber(number, decimalPlaces = 1, locale = 'en-US') {
  if (number === null || number === undefined || isNaN(number)) return '0';
  
  // If the number is too small, just return the normal number to avoid weird trailing decimals
  if (Math.abs(number) < 1000) return new Intl.NumberFormat(locale).format(number);

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: decimalPlaces,
    minimumFractionDigits: 0 // Prevents "1.0K", just shows "1K"
  }).format(number);
}

/**
 * Calculates human-readable relative time from a UTC timestamp.
 * Example: "Updated 6 days ago"
 */
export function getTimeAgo(utcTimestamp, prefix = '') {
  if (!utcTimestamp) return '';
  
  const localTimestamp = new Date(utcTimestamp).getTime();
  const currentTimestamp = Date.now();
  const timeDiff = currentTimestamp - localTimestamp;

  // Gracefully handle slight future drift from server clocks
  if (timeDiff < 0) return `${prefix ? prefix + ' ' : ''}Just now`.trim();

  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  let timeString = '';

  if (years > 0) {
     timeString = `${years} year${years > 1 ? 's' : ''} ago`;
  } else if (months > 0) {
     timeString = `${months} month${months > 1 ? 's' : ''} ago`;
  } else if (days > 0) {
     timeString = `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
     timeString = `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
     timeString = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
     timeString = `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }

  return prefix ? `${prefix} ${timeString}` : timeString;
}

/**
 * Returns raw millisecond difference for sorting or logic comparisons
 */
export function getTimeAgoInMs(utcTimestamp) {
  if (!utcTimestamp) return 0;
  const localTimestamp = new Date(utcTimestamp).getTime();
  return Date.now() - localTimestamp;
}