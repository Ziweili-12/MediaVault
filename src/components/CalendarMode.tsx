import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = (SCREEN_WIDTH - 32 - 6 * 8) / 7; // 7列，间距8px
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

interface CalendarRecord {
  id: number;
  date: string; // YYYY-MM-DD
  type: 'music' | 'movie';
  title: string;
  coverUrl?: string;
}

interface CalendarModeProps {
  records: CalendarRecord[];
  onRecordPress?: (record: CalendarRecord) => void;
  onClose?: () => void;
}

const CalendarMode: React.FC<CalendarModeProps> = ({
  records,
  onRecordPress,
  onClose,
}) => {
  const { colors } = useTheme();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 计算日历数据
  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startWeekday = firstDay.getDay(); // 0=周日
    const daysInMonth = lastDay.getDate();

    // 构建日期网格
    const days: (number | null)[] = [];
    
    // 填充月初空白
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }
    
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [currentYear, currentMonth]);

  // 按日期分组记录
  const recordsByDate = useMemo(() => {
    const map: Record<string, CalendarRecord[]> = {};
    records.forEach(record => {
      if (!map[record.date]) {
        map[record.date] = [];
      }
      map[record.date].push(record);
    });
    return map;
  }, [records]);

  // 获取某天的记录数量
  const getRecordCount = (day: number): number => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return recordsByDate[dateStr]?.length || 0;
  };

  // 检查是否是今天
  const isToday = (day: number): boolean => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // 检查是否被选中
  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDate === dateStr;
  };

  // 切换月份
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  // 处理日期点击
  const handleDayPress = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  // 获取选中日期的记录
  const selectedRecords = selectedDate ? recordsByDate[selectedDate] || [] : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>日历视图</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 月份导航 */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {currentYear}年 {MONTH_NAMES[currentMonth]}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 星期标题 */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={[
              styles.weekdayText,
              { color: index === 0 || index === 6 ? colors.accent : colors.textSecondary }
            ]}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 日期网格 */}
      <View style={styles.calendarGrid}>
        {calendarData.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const count = getRecordCount(day);
          const todayFlag = isToday(day);
          const selectedFlag = isSelected(day);

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                todayFlag && { borderColor: colors.accent, borderWidth: 2 },
                selectedFlag && { backgroundColor: colors.accent + '20' },
              ]}
              onPress={() => handleDayPress(day)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayText,
                { color: colors.text },
                todayFlag && { color: colors.accent, fontWeight: '700' },
              ]}>
                {day}
              </Text>
              {count > 0 && (
                <View style={[styles.recordBadge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.recordBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 选中日期的记录列表 */}
      {selectedDate && (
        <View style={[styles.selectedRecords, { borderTopColor: colors.cardBorder }]}>
          <Text style={[styles.selectedDateTitle, { color: colors.text }]}>
            {selectedDate} 的记录
          </Text>
          {selectedRecords.length === 0 ? (
            <Text style={[styles.noRecords, { color: colors.textSecondary }]}>
              该日暂无记录
            </Text>
          ) : (
            <ScrollView style={styles.recordsList}>
              {selectedRecords.map((record, index) => (
                <TouchableOpacity
                  key={record.id}
                  style={[styles.recordItem, { backgroundColor: colors.card }]}
                  onPress={() => onRecordPress?.(record)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recordIcon}>
                    <Ionicons
                      name={record.type === 'music' ? 'musical-notes' : 'film'}
                      size={20}
                      color={record.type === 'music' ? '#0a84ff' : '#f97316'}
                    />
                  </View>
                  <View style={styles.recordInfo}>
                    <Text style={[styles.recordTitle, { color: colors.text }]} numberOfLines={1}>
                      {record.title}
                    </Text>
                    <Text style={[styles.recordType, { color: colors.textSecondary }]}>
                      {record.type === 'music' ? '音乐' : '影视'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  recordBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  selectedRecords: {
    flex: 1,
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  noRecords: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  recordsList: {
    flex: 1,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordType: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default CalendarMode;
