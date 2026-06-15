import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design was built at 390px wide (iPhone 14 Pro width)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

export function scale(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel(size * (SCREEN_WIDTH / BASE_WIDTH)));
}

export function verticalScale(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel(size * (SCREEN_HEIGHT / BASE_HEIGHT)));
}

export function moderateScale(size: number, factor = 0.5): number {
  return Math.round(PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor));
}

export function isSmallScreen(): boolean {
  return SCREEN_WIDTH < 380;
}

export function isTablet(): boolean {
  return SCREEN_WIDTH >= 768;
}

export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

export function gridColumns(): number {
  return SCREEN_WIDTH >= 768 ? 3 : 2;
}

export function cardWidth(outerPadding = 20, gap = 12, columns = gridColumns()): number {
  return (SCREEN_WIDTH - outerPadding * 2 - gap * (columns - 1)) / columns;
}
