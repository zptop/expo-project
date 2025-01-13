import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabBar from '../components/TabBar';

// 导入页面组件 - 使用新的路径
import Login from '../page/user/login/index';
import CommonLines from '../page/common-lines/index';
import Goods from '../page/goods/index';
import WaybillList from '../page/my-waybill/index';
import Service from '../page/service/index';
import Mine from '../page/mine/index';
import SignContract from '../page/my-waybill/sign-contract';
import SignContractImg from '../page/my-waybill/sign-contract-img';
import Message from '../page/message/index';
import MessageDetail from '../page/message/detail';
import TaxAuth from '../page/my-waybill/tax-auth';
import AgentSign from '../page/my-waybill/agent-sign';
import AgreementDetails from '../page/my-waybill/agreement-details';
import WaybillDetail from '../page/my-waybill/waybill-detail';
import ReportEvent from '../page/my-waybill/report-event';
import EvaluateOwner from '../page/my-waybill/evaluate-owner';
import MyProfile from '../page/my-profile/index';
import MyProfileDetail from '../page/my-profile/detail';
import VehicleManagement from '../page/vehicle-management/index';
import Settings from '../page/settings/index';
import VehicleAdd from '../page/vehicle-add/index';
import ModifyMobile from '../page/setting/modify-mobile/index';
import ModifyBank from '../page/my-profile/modify-bank';
import Copyright from '../page/settings/Copyright';
import RemoteUnload from '../page/my-waybill/remote-unload';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 主页面Tab导航
function MainTabs() {
  return (
    <Tab.Navigator 
      tabBar={props => <TabBar {...props} />}
      initialRouteName="Waybill"
    >
      <Tab.Screen name="CommonLines" component={CommonLines} options={{ headerShown: false }} />
      <Tab.Screen name="Goods" component={Goods} options={{ headerShown: false }} />
      <Tab.Screen name="Waybill" component={WaybillList} options={{ headerShown: false }} />
      <Tab.Screen name="Service" component={Service} options={{ headerShown: false }} />
      <Tab.Screen name="Mine" component={Mine} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// 路由配置
const routes = [
  {
    name: 'Login',
    component: Login,
    options: {
      headerShown: false
    }
  },
  {
    name: 'Main',
    component: MainTabs,
    options: {
      headerShown: false
    }
  },
  {
    name: 'SignContract',
    component: SignContract,
    options: {
      title: '合同签署',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'SignContractImg',
    component: SignContractImg,
    options: {
      title: '合同图片',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'Message',
    component: Message,
    options: {
      title: '消息中心',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'MessageDetail',
    component: MessageDetail,
    options: {
      title: '消息详情',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'TaxAuth',
    component: TaxAuth,
    options: {
      title: '税务认证',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'AgentSign',
    component: AgentSign,
    options: {
      title: '代征协议签署',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'AgreementDetails',
    component: AgreementDetails,
    options: {
      title: '协议单详情',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'WaybillDetail',
    component: WaybillDetail,
    options: {
      title: '运单详情',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'ReportEvent',
    component: ReportEvent,
    options: {
      title: '异常上报'
    }
  },
  {
    name: 'EvaluateOwner',
    component: EvaluateOwner,
    options: {
      title: '评价货主'
    }
  },
  {
    name: 'MyProfile',
    component: MyProfile,
    options: {
      title: '身份认证',
      headerShown: true
    }
  },
  {
    name: 'MyProfileDetail',
    component: MyProfileDetail,
    options: {
      title: '我的资料',
      headerShown: true
    }
  },
  {
    name: 'Waybill',
    component: WaybillList,
    options: {
      title: '我的运输单',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'VehicleManagement',
    component: VehicleManagement,
    options: {
      title: '车辆管理',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'Settings',
    component: Settings,
    options: {
      title: '设置',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'Copyright',
    component: Copyright,
    options: {
      title: '版权所有',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    }
  },
  {
    name: 'VehicleAdd',
    component: VehicleAdd,
    options: ({ route }) => ({
      title: route?.params?.user_vehicleid ? '编辑车辆' : '新增车辆',
      headerShown: true,
      headerBackTitle: '',
      headerBackTitleVisible: false,
      headerLeftLabelVisible: false,
    })
  },
  {
    name: 'ModifyMobile',
    component: ModifyMobile,
    options: {
      title: '修改手机号',
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#333',
      headerTitleStyle: {
        fontWeight: 'normal',
      },
    }
  },
  {
    name: 'ModifyBank',
    component: ModifyBank,
    options: {
      title: '银行卡号',
      headerStyle: {
        backgroundColor: '#fff',
      },
      headerTintColor: '#333',
      headerTitleStyle: {
        fontWeight: 'normal',
      },
    }
  },
  {
    name: 'RemoteUnload',
    component: RemoteUnload,
    options: {
      title: '异地卸货点'
    }
  }
];

// 默认路由配置
const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: '#fff',
  },
  headerTintColor: '#333',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerBackTitle: '',
  headerBackTitleVisible: false,
};

export function Router() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={defaultScreenOptions}
    >
      {routes.map(route => (
        <Stack.Screen
          key={route.name}
          name={route.name}
          component={route.component}
          options={route.options}
        />
      ))}
    </Stack.Navigator>
  );
}

export default Router; 