import Toast from 'react-native-root-toast';

let currentToast = null;

const toast = {
  show(message, duration = 2000) {
    // 如果有正在显示的 toast，先隐藏
    if (currentToast) {
      Toast.hide(currentToast);
    }

    // 创建新的 toast
    currentToast = Toast.show(message, {
      duration: duration,
      position: Toast.positions.CENTER,  // 使用 CENTER 确保显示在中间
      shadow: false,
      animation: true,
      hideOnPress: true,
      opacity: 0.9,
      delay: 0,
      containerStyle: {
        zIndex: 10000,
        elevation: 10000,
        padding: 10,  // 添加内边距
        borderRadius: 5,  // 圆角
        backgroundColor: 'rgba(0, 0, 0, 0.8)',  // 半透明黑色背景
      },
      textStyle: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
      },
      onHidden: () => {
        currentToast = null;
      }
    });
  },

  success(message) {
    this.show(message);
  },

  error(message) {
    this.show(message);
  },

  close() {
    if (currentToast) {
      Toast.hide(currentToast);
      currentToast = null;
    }
  }
};

export default toast; 