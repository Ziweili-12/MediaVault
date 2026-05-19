import { Platform } from 'react-native';

/**
 * 从图片URL提取主色调
 * 使用 Canvas API (Web) 或简化算法 (Native)
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string[];
}

// 默认颜色（蓝色系）
const DEFAULT_PALETTE: ColorPalette = {
  primary: '#3b82f6',
  secondary: '#1e40af',
  accent: '#60a5fa',
  gradient: ['#1e3a8a', '#3b82f6', '#93c5fd'],
};

/**
 * 从图片URL提取颜色（同步版本，用于列表渲染）
 */
export function extractColorsSync(imageUrl: string): ColorPalette {
  if (!imageUrl) return DEFAULT_PALETTE;

  try {
    if (Platform.OS === 'web') {
      // Web 平台：使用同步的 URL hash 算法
      return extractColorsNative(imageUrl);
    } else {
      // Native: 使用简化算法（基于URL hash生成稳定颜色）
      return extractColorsNative(imageUrl);
    }
  } catch (error) {
    console.warn('Color extraction failed:', error);
    return DEFAULT_PALETTE;
  }
}

/**
 * 从图片URL提取颜色
 */
export async function extractColors(imageUrl: string): Promise<ColorPalette> {
  if (!imageUrl) return DEFAULT_PALETTE;

  try {
    if (Platform.OS === 'web') {
      return await extractColorsWeb(imageUrl);
    } else {
      // Native: 使用简化算法（基于URL hash生成稳定颜色）
      return extractColorsNative(imageUrl);
    }
  } catch (error) {
    console.warn('Color extraction failed:', error);
    return DEFAULT_PALETTE;
  }
}

/**
 * Web平台：使用Canvas提取颜色
 */
async function extractColorsWeb(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        // 缩小图片以提高性能
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // 采样颜色
        const colors: Map<string, number> = new Map();
        for (let i = 0; i < pixels.length; i += 16) { // 每4个像素采样一次
          const r = Math.round(pixels[i] / 32) * 32;
          const g = Math.round(pixels[i + 1] / 32) * 32;
          const b = Math.round(pixels[i + 2] / 32) * 32;
          const key = `${r},${g},${b}`;
          colors.set(key, (colors.get(key) || 0) + 1);
        }

        // 找出最常见的颜色
        const sorted = Array.from(colors.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3);

        if (sorted.length >= 3) {
          const [r1, g1, b1] = sorted[0][0].split(',').map(Number);
          const [r2, g2, b2] = sorted[1][0].split(',').map(Number);
          const [r3, g3, b3] = sorted[2][0].split(',').map(Number);

          resolve({
            primary: rgbToHex(r1, g1, b1),
            secondary: rgbToHex(r2, g2, b2),
            accent: rgbToHex(r3, g3, b3),
            gradient: [
              rgbToHex(r1, g1, b1),
              rgbToHex(r2, g2, b2),
              rgbToHex(r3, g3, b3),
            ],
          });
        } else {
          resolve(DEFAULT_PALETTE);
        }
      } catch (e) {
        resolve(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => resolve(DEFAULT_PALETTE);
    img.src = imageUrl;
  });
}

/**
 * Native平台：基于URL生成稳定颜色
 */
function extractColorsNative(imageUrl: string): ColorPalette {
  // 简单hash算法
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = ((hash << 5) - hash) + imageUrl.charCodeAt(i);
    hash = hash & hash;
  }
  hash = Math.abs(hash);

  // 生成色相
  const hue1 = hash % 360;
  const hue2 = (hue1 + 30) % 360;
  const hue3 = (hue1 + 60) % 360;

  return {
    primary: hslToHex(hue1, 70, 50),
    secondary: hslToHex(hue2, 60, 40),
    accent: hslToHex(hue3, 80, 60),
    gradient: [
      hslToHex(hue1, 70, 30),
      hslToHex(hue1, 70, 50),
      hslToHex(hue2, 60, 70),
    ],
  };
}

/**
 * RGB转HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * HSL转HEX
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * 生成渐变样式
 */
export function getGradientStyle(palette: ColorPalette, opacity: number = 0.8): string {
  return `linear-gradient(135deg, ${palette.gradient[0]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${palette.gradient[1]}${Math.round(opacity * 255).toString(16).padStart(2, '0')}, ${palette.gradient[2]}${Math.round(opacity * 255).toString(16).padStart(2, '0')})`;
}

/**
 * 调整颜色亮度
 */
export function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent)));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + Math.round(2.55 * percent)));
  return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
}
