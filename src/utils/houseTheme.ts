import { HouseName } from '../types';

export interface HouseThemeConfig {
  name: HouseName;
  mascot: string;
  motto: string;
  emoji: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  dotColor: string;
  gradientBg: string;
  darkGradientBg: string;
  textColor: string;
  hexColor: string;
}

export const HOUSE_THEMES: Record<HouseName, HouseThemeConfig> = {
  Red: {
    name: 'Red',
    mascot: 'Phoenix',
    motto: 'Courage & Passion',
    emoji: '🔥',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-400',
    badgeBorder: 'border-rose-200 dark:border-rose-800/60',
    cardBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    dotColor: 'bg-rose-500',
    gradientBg: 'from-rose-500 to-red-600',
    darkGradientBg: 'from-rose-950/50 to-slate-900',
    textColor: 'text-rose-600 dark:text-rose-400',
    hexColor: '#f43f5e',
  },
  Blue: {
    name: 'Blue',
    mascot: 'Knights',
    motto: 'Wisdom & Power',
    emoji: '⚡',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-400',
    badgeBorder: 'border-sky-200 dark:border-sky-800/60',
    cardBorder: 'hover:border-sky-300 dark:hover:border-sky-700',
    dotColor: 'bg-sky-500',
    gradientBg: 'from-sky-500 to-blue-600',
    darkGradientBg: 'from-sky-950/50 to-slate-900',
    textColor: 'text-sky-600 dark:text-sky-400',
    hexColor: '#0ea5e9',
  },
  Green: {
    name: 'Green',
    mascot: 'Dragons',
    motto: 'Growth & Tenacity',
    emoji: '🌿',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
    cardBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    dotColor: 'bg-emerald-500',
    gradientBg: 'from-emerald-500 to-teal-600',
    darkGradientBg: 'from-emerald-950/50 to-slate-900',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    hexColor: '#10b981',
  },
  Yellow: {
    name: 'Yellow',
    mascot: 'Griffins',
    motto: 'Honor & Brilliance',
    emoji: '⭐',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-800/60',
    cardBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    dotColor: 'bg-amber-500',
    gradientBg: 'from-amber-400 to-amber-600',
    darkGradientBg: 'from-amber-950/50 to-slate-900',
    textColor: 'text-amber-700 dark:text-amber-400',
    hexColor: '#f59e0b',
  },
};

export function getHouseTheme(house: HouseName): HouseThemeConfig {
  return HOUSE_THEMES[house] || HOUSE_THEMES.Blue;
}
