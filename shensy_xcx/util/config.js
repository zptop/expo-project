import toast from './toast';
import request from './request';
import { Platform } from 'react-native';

const edition_num = "V1.0.0";
// 根据平台选择对应的 key
const amapkey = Platform.select({
    ios: 'your_ios_key',
    android: 'your_android_key',
});
const amapSecretKey = '	706f07e7fe78575fd3ef67c0e8f160ac'; // 安全密钥
let config = {
  edition_num,
  amapkey,
  amapSecretKey,
  ossParam: null,

  setOssParam: function (ossParam) {
    this.ossParam = ossParam;
  },

  getOssMess: function (file_suffix_type) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await request.get('/app_driver/obs/getObsCfg', {
          file_suffix_type
        });
        if (res.code > 0) {
          toast.show(res.msg);
          resolve({
            isSucc: false
          });
        } else {
          let obj = res.data;
          this.setOssParam(obj);
          resolve({
            isSucc: true,
            ossParam: obj
          });
        }
      } catch (error) {
        throw error;
      }
    })
  },

  // 修改后的 ossUpLoadFileRequest 方法
  ossUpLoadFileRequest: async function (tag, message, fileUri, headerParams, requestCode, onsuccess, onfail) {
    if (message) {
      toast.show(message);
    }

    try {
      const formData = new FormData();

      // 添加华为云 OSS 必需的参数
      formData.append('key', this.ossParam.DirKey);
      formData.append('policy', this.ossParam.Policy);
      formData.append('AccessKeyId', this.ossParam.AccessKeyId);
      formData.append('signature', this.ossParam.Signature);

      // 添加文件
      formData.append('file', {
        uri: fileUri,
        type: this.ossParam.ContentType,
        name: 'file',
      });

      // 添加其他参数
      Object.keys(headerParams).forEach(key => {
        formData.append(key, headerParams[key]);
      });

      const response = await fetch(this.ossParam.Host, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 || response.status === 204) {
        onsuccess({ statusCode: response.status }, requestCode);
      } else {
        onfail({ msg: '上传失败' }, requestCode);
      }
    } catch (error) {
      onfail({ msg: '网络错误，请重试' }, requestCode);
    }
  }
};

export default config;