import { Dimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// iPhone 12 及之后的设备特征
const IPHONE_12_SERIES = [
  { width: 390, height: 844 }, // iPhone 12, 12 Pro
  { width: 390, height: 844 }, // iPhone 13, 13 Pro
  { width: 393, height: 852 }, // iPhone 14, 15
  { width: 393, height: 852 }, // iPhone 14 Pro, 15 Pro
  { width: 430, height: 932 }, // iPhone 14 Pro Max, 15 Pro Max
  { width: 428, height: 926 }, // iPhone 12 Pro Max, 13 Pro Max
];

// 检测是否为刘海屏/灵动岛设备
export function hasNotch(): boolean {
  if (Platform.OS !== 'ios') return false;
  
  // 检查屏幕尺寸是否匹配已知的刘海屏设备
  return IPHONE_12_SERIES.some(
    device => 
      (SCREEN_WIDTH === device.width && SCREEN_HEIGHT === device.height) ||
      (SCREEN_WIDTH === device.height && SCREEN_HEIGHT === device.width)
  );
}

// 检测是否为 iPhone 12 及之后的设备
export function isModernIPhone(): boolean {
  if (Platform.OS !== 'ios') return false;
  
  // iPhone 12 系列屏幕宽度 >= 390
  return SCREEN_WIDTH >= 390;
}

// 获取状态栏高度
export function getStatusBarHeight(): number {
  if (Platform.OS === 'ios') {
    return hasNotch() ? 47 : 20;
  }
  return StatusBar.currentHeight || 0;
}

// 获取底部安全区域高度
export function getBottomInset(): number {
  return hasNotch() ? 34 : 0;
}

// 获取灵动岛区域的额外顶部边距
export function getDynamicIslandTopMargin(): number {
  if (!hasNotch()) return 0;
  // 灵动岛设备需要额外的顶部边距
  return isModernIPhone() ? 12 : 0;
}

// 获取适配后的样式
export function useDeviceAdaptation() {
  // 这个 hook 需要在组件内部使用 useSafeAreaInsets
  return {
    hasNotch: hasNotch(),
    isModernIPhone: isModernIPhone(),
    statusBarHeight: getStatusBarHeight(),
    bottomInset: getBottomInset(),
    dynamicIslandTopMargin: getDynamicIslandTopMargin(),
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
  };
}

// 设备适配样式生成器
export function createAdaptedStyles(insets: { top: number; bottom: number }) {
  const isModern = isModernIPhone();
  const hasNotchDevice = hasNotch();
  
  return {
    // 顶部容器样式
    headerContainer: {
      paddingTop: hasNotchDevice ? insets.top + 8 : insets.top,
      minHeight: hasNotchDevice ? 100 : 60,
    },
    
    // 底部Tab栏样式
    tabBarContainer: {
      paddingBottom: hasNotchDevice ? insets.bottom : 8,
      height: hasNotchDevice ? 84 + insets.bottom : 64,
    },
    
    // 内容区域样式
    contentContainer: {
      paddingBottom: hasNotchDevice ? insets.bottom + 16 : 24,
    },
    
    // 弹窗样式
    modalContainer: {
      paddingTop: hasNotchDevice ? insets.top + 20 : 20,
    },
    
    // 列表样式
    listContainer: {
      paddingHorizontal: isModern ? 20 : 16,
    },
  };
}

// 屏幕尺寸常量
export const DEVICE = {
  IS_SMALL_SCREEN: SCREEN_WIDTH < 375,
  IS_MEDIUM_SCREEN: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  IS_LARGE_SCREEN: SCREEN_WIDTH >= 414,
  IS_TABLET: SCREEN_WIDTH >= 768,
  
  // 网格配置
  GRID_COLUMNS: SCREEN_WIDTH < 375 ? 2 : SCREEN_WIDTH < 768 ? 2 : 3,
  GRID_GAP: SCREEN_WIDTH < 375 ? 10 : 12,
  
  // 字体大小缩放
  FONT_SCALE: SCREEN_WIDTH < 375 ? 0.9 : 1,
};
