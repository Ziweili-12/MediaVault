import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';

interface StarRatingProps {
  rating: number; // 0-10, 支持小数
  onRate?: (rating: number) => void;
  size?: number;
  disabled?: boolean;
  showValue?: boolean;
  maxRating?: number;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  onRate,
  size = 28,
  disabled = false,
  showValue = true,
  maxRating = 10,
}) => {
  const { colors } = useTheme();
  const [currentRating, setCurrentRating] = useState(rating);
  const [isDragging, setIsDragging] = useState(false);

  // 10分制转5星（每星2分）
  const starCount = 5;
  const starRating = currentRating / 2;

  // 计算每个星星的填充比例
  const getStarFill = (index: number): number => {
    const starIndex = index + 1;
    if (starRating >= starIndex) return 1;
    if (starRating >= starIndex - 0.5) return 0.5;
    return 0;
  };

  // PanResponder处理滑动评分
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (evt) => {
      if (disabled) return;
      setIsDragging(true);
      handleTouch(evt.nativeEvent.locationX);
    },
    onPanResponderMove: (evt) => {
      if (disabled) return;
      handleTouch(evt.nativeEvent.locationX);
    },
    onPanResponderRelease: () => {
      if (disabled) return;
      setIsDragging(false);
      onRate?.(currentRating);
    },
  });

  // 处理触摸/滑动
  const handleTouch = useCallback((x: number) => {
    const starWidth = size + 4; // 星星宽度+间距
    const totalWidth = starWidth * starCount;
    const startX = 0; // 第一个星星的起始位置

    // 计算触摸位置对应的星星
    const position = x - startX;
    const starIndex = Math.floor(position / starWidth);
    const positionInStar = (position % starWidth) / starWidth;

    if (starIndex < 0) {
      setCurrentRating(0);
      return;
    }
    if (starIndex >= starCount) {
      setCurrentRating(maxRating);
      return;
    }

    // 计算评分（支持半星）
    let newRating: number;
    if (positionInStar < 0.5) {
      newRating = starIndex * 2 + 1; // 半星
    } else {
      newRating = (starIndex + 1) * 2; // 整星
    }

    setCurrentRating(Math.min(maxRating, Math.max(0, newRating)));
  }, [size, maxRating, disabled]);

  // 渲染单个星星
  const renderStar = (index: number) => {
    const fill = getStarFill(index);
    const isFull = fill === 1;
    const isHalf = fill === 0.5;

    return (
      <View
        key={index}
        style={[
          styles.starContainer,
          { width: size, height: size },
        ]}
      >
        {/* 空心星星（背景） */}
        <Text style={[styles.star, { fontSize: size, color: colors.inputBg }]}>
          ★
        </Text>

        {/* 填充星星 */}
        {(isFull || isHalf) && (
          <View
            style={[
              styles.starFill,
              {
                width: isFull ? '100%' : '50%',
                overflow: 'hidden',
              },
            ]}
          >
            <Text style={[styles.star, { fontSize: size, color: '#ffd60a' }]}>
              ★
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.starsRow}
        {...panResponder.panHandlers}
      >
        {Array.from({ length: starCount }).map((_, index) => renderStar(index))}
      </View>

      {showValue && (
        <Text style={[styles.ratingText, { color: colors.text }]}>
          {currentRating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  starContainer: {
    position: 'relative',
  },
  star: {
    fontWeight: 'bold',
  },
  starFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 4,
  },
});

export default StarRating;
