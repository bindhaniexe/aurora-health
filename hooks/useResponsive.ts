import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export function useResponsive() {
  const [dims, setDims] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  return {
    width: dims.width,
    height: dims.height,
    isSmall: dims.width < 380,
    isTablet: dims.width >= 768,
    columns: dims.width >= 768 ? 3 : 2,
    cardWidth: (pad = 20, gap = 12, cols = dims.width >= 768 ? 3 : 2) =>
      (dims.width - pad * 2 - gap * (cols - 1)) / cols,
  };
}
