import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
} from 'react-native';
import Modal from 'react-native-modal';
import { Picker } from '@react-native-picker/picker';

// 格式化数字为两位数
const formatNumber = (num) => {
  return num < 10 ? `0${num}月` : `${num}月`;
};

export default function DatePicker({ 
  isVisible, 
  date = new Date(),
  onConfirm, 
  onCancel,
  action = 30,
  title
}) {
  const [selectedDate, setSelectedDate] = useState(date);

  // 生成年份选项（前3年到后3年）
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 7 }, 
    (_, i) => currentYear - 3 + i
  );

  // 生成月份选项
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 生成天数选项
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };
  const days = Array.from(
    { length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth() + 1) }, 
    (_, i) => i + 1
  );

  // 生成小时选项
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 生成分钟选项
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // 生成秒数选项
  const seconds = Array.from({ length: 60 }, (_, i) => i);

  // 根据 action 生成标题
  const getTitle = () => {
    if (title) return title; // 如果传入了 title，优先使用传入的
    return action === 30 ? '确认到达目的地时间' : '确认离开目的地时间';
  };

  return (
    <Modal
      isVisible={isVisible}
      style={styles.modal}
      backdropOpacity={0.5}
      onBackdropPress={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{getTitle()}</Text>
          <TouchableOpacity onPress={() => onConfirm(selectedDate)}>
            <Text style={styles.confirmText}>确定</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pickerContainer}>
          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Picker
                style={styles.picker}
                selectedValue={selectedDate.getFullYear()}
                onValueChange={(value) => {
                  const newDate = new Date(selectedDate);
                  newDate.setFullYear(value);
                  setSelectedDate(newDate);
                }}
                itemStyle={styles.pickerItem}
              >
                {years.map(year => (
                  <Picker.Item 
                    key={year} 
                    label={`${year}年`} 
                    value={year}
                  />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerColumn}>
              <Picker
                style={styles.picker}
                selectedValue={selectedDate.getMonth() + 1}
                onValueChange={(value) => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(value - 1);
                  setSelectedDate(newDate);
                }}
                itemStyle={styles.pickerItem}
              >
                {months.map(month => (
                  <Picker.Item 
                    key={month} 
                    label={formatNumber(month)} 
                    value={month}
                  />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerColumn}>
              <Picker
                style={styles.picker}
                selectedValue={selectedDate.getDate()}
                onValueChange={(value) => {
                  const newDate = new Date(selectedDate);
                  newDate.setDate(value);
                  setSelectedDate(newDate);
                }}
                itemStyle={styles.pickerItem}
              >
                {days.map(day => (
                  <Picker.Item 
                    key={day} 
                    label={`${day}日`} 
                    value={day}
                  />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerColumn}>
              <Picker
                style={styles.picker}
                selectedValue={selectedDate.getHours()}
                onValueChange={(value) => {
                  const newDate = new Date(selectedDate);
                  newDate.setHours(value);
                  setSelectedDate(newDate);
                }}
                itemStyle={styles.pickerItem}
              >
                {hours.map(hour => (
                  <Picker.Item 
                    key={hour} 
                    label={`${hour}时`} 
                    value={hour}
                  />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerColumn}>
              <Picker
                style={styles.picker}
                selectedValue={selectedDate.getMinutes()}
                onValueChange={(value) => {
                  const newDate = new Date(selectedDate);
                  newDate.setMinutes(value);
                  setSelectedDate(newDate);
                }}
                itemStyle={styles.pickerItem}
              >
                {minutes.map(minute => (
                  <Picker.Item 
                    key={minute} 
                    label={`${minute}分`} 
                    value={minute}
                  />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerColumn}>
              <Picker
                style={styles.picker}
                selectedValue={selectedDate.getSeconds()}
                onValueChange={(value) => {
                  const newDate = new Date(selectedDate);
                  newDate.setSeconds(value);
                  setSelectedDate(newDate);
                }}
                itemStyle={styles.pickerItem}
              >
                {seconds.map(second => (
                  <Picker.Item 
                    key={second} 
                    label={`${second}秒`} 
                    value={second}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    paddingBottom: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 45,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
    color: '#333',
  },
  cancelText: {
    fontSize: 16,
    color: '#b2b2b2',
  },
  confirmText: {
    fontSize: 16,
    color: '#1890ff',
  },
  pickerContainer: {
    backgroundColor: '#fff',
  },
  pickerRow: {
    flexDirection: 'row',
    height: 250,
  },
  pickerColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    width: 110,
    height: '100%',
  },
  pickerItem: {
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  pickerLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: -6,
  },
}); 