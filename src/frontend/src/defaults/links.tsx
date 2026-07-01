import { openContextModal } from '@mantine/modals';

import { StylishText } from '@lib/components/StylishText';
import { UserRoles } from '@lib/enums/Roles';
import type { SettingsStateProps } from '@lib/types/Settings';
import type { UserStateProps } from '@lib/types/User';
import {
  IconBox,
  IconBuildingWarehouse,
  IconBuildingFactory2,
  IconDashboard,
  IconPackages,
  IconShoppingCart,
  IconTruckDelivery
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import type { MenuLinkItem } from '../components/items/MenuLinks';
import { useGlobalSettingsState } from '../states/SettingsStates';

type NavTab = {
  name: string;
  title: string;
  icon: ReactNode;
  visible?: boolean;
};

const showLegacyBusinessTabs = false;

export function getNavTabs(user: UserStateProps): NavTab[] {
  const globalSettings = useGlobalSettingsState.getState();

  const navTabs: NavTab[] = [
    {
      name: 'home',
      title: '首页',
      icon: <IconDashboard />
    },
    {
      name: 'cold-storage',
      title: '冷库工作台',
      icon: <IconBuildingWarehouse />,
      visible:
        user.hasViewRole(UserRoles.stock) ||
        user.hasViewRole(UserRoles.stock_location)
    },
    {
      name: 'part',
      title: '货品',
      icon: <IconBox />,
      visible:
        user.hasViewRole(UserRoles.part) ||
        user.hasViewRole(UserRoles.part_category)
    },
    {
      name: 'stock',
      title: '库存',
      icon: <IconPackages />,
      visible:
        user.hasViewRole(UserRoles.stock) ||
        user.hasViewRole(UserRoles.stock_location) ||
        (globalSettings.isSet('TRANSFERORDER_ENABLED') &&
          user.hasViewRole(UserRoles.transfer_order))
    },
    {
      name: 'manufacturing',
      title: '组合配货',
      icon: <IconBuildingFactory2 />,
      visible: showLegacyBusinessTabs && user.hasViewRole(UserRoles.build)
    },
    {
      name: 'purchasing',
      title: '进货',
      icon: <IconShoppingCart />,
      visible:
        showLegacyBusinessTabs && user.hasViewRole(UserRoles.purchase_order)
    },
    {
      name: 'sales',
      title: '出货',
      icon: <IconTruckDelivery />,
      visible:
        showLegacyBusinessTabs &&
        (user.hasViewRole(UserRoles.sales_order) ||
          (globalSettings.isSet('RETURNORDER_ENABLED') &&
            user.hasViewRole(UserRoles.return_order)))
    }
  ];

  return navTabs.filter((tab) => {
    return tab.visible !== false;
  });
}

export const docLinks = {
  app: 'https://docs.inventree.org/en/latest/app/',
  getting_started: 'https://docs.inventree.org/en/latest/start/',
  api: 'https://docs.inventree.org/en/latest/api/',
  developer: 'https://docs.inventree.org/en/latest/develop/contributing/',
  faq: 'https://docs.inventree.org/en/latest/faq/',
  github: 'https://github.com/inventree/inventree',
  errorcodes: 'https://docs.inventree.org/en/latest/sref/error-codes/'
};

export function DocumentationLinks(): MenuLinkItem[] {
  return [
    {
      id: 'gettin-started',
      title: '入门说明',
      link: docLinks.getting_started,
      external: true,
      description: '查看系统入门文档'
    },
    {
      id: 'api',
      title: '接口文档',
      link: docLinks.api,
      external: true,
      description: '查看系统接口文档'
    },
    {
      id: 'developer',
      title: '开发手册',
      link: docLinks.developer,
      external: true,
      description: '查看系统开发手册'
    },
    {
      id: 'faq',
      title: '常见问题',
      link: docLinks.faq,
      external: true,
      description: '查看常见问题'
    },
    {
      id: 'github',
      title: '源代码仓库',
      link: docLinks.github,
      external: true,
      description: '查看 GitHub 上的系统源代码'
    }
  ];
}

export function serverInfo() {
  return openContextModal({
    modal: 'info',
    title: (
      <StylishText size='xl'>
        系统信息
      </StylishText>
    ),
    size: 'xl',
    innerProps: {}
  });
}

export function aboutInvenTree() {
  return openContextModal({
    modal: 'about',
    title: (
      <StylishText size='xl'>
        关于系统
      </StylishText>
    ),
    size: 'xl',
    innerProps: {}
  });
}

export function licenseInfo() {
  return openContextModal({
    modal: 'license',
    title: (
      <StylishText size='xl'>
        许可证信息
      </StylishText>
    ),
    size: 'xl',
    innerProps: {}
  });
}

export function AboutLinks(
  settings: SettingsStateProps,
  user: UserStateProps
): MenuLinkItem[] {
  const base_items: MenuLinkItem[] = [
    {
      id: 'instance',
      title: '系统信息',
      description: '查看当前系统实例信息',
      icon: 'info',
      action: serverInfo
    },
    {
      id: 'licenses',
      title: '许可证信息',
      description: '查看系统依赖软件的许可证信息',
      icon: 'license',
      action: licenseInfo
    }
  ];

  // Restrict the about link if that setting is set
  if (user.isSuperuser() || !settings.isSet('INVENTREE_RESTRICT_ABOUT')) {
    base_items.push({
      id: 'about',
      title: '关于系统',
      description: '查看系统项目信息',
      icon: 'info',
      action: aboutInvenTree
    });
  }
  return base_items;
}
