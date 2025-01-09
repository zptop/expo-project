// 通用工具类
const util = {
  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return [year, month, day].map(this.formatNumber).join('/') + ' ' + 
           [hour, minute, second].map(this.formatNumber).join(':');
  },

  formatNumber(n) {
    n = n.toString();
    return n[1] ? n : '0' + n;
  },

  // 防抖
  debounce(fn, wait = 1000) {
    let timer = null;
    return function(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, wait);
    };
  }
};

export default util; 