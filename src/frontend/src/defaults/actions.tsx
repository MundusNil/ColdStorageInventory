import { t } from '@lingui/core/macro';
import type { SpotlightActionData } from '@mantine/spotlight';
import {
  IconBarcode,
  IconDevicesPc,
  IconLink,
  IconPlug,
  IconPointer,
  IconReport,
  IconSettings,
  IconTags,
  IconUserBolt,
  IconUserCog,
  IconUsers
} from '@tabler/icons-react';
import type { NavigateFunction } from 'react-router-dom';

import { ModelInformationDict } from '@lib/enums/ModelInformation';
import { ModelType, StylishText, UserRoles } from '@lib/index';
import { Trans } from '@lingui/react/macro';
import { openContextModal } from '@mantine/modals';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLocalState } from '../states/LocalState';
import { useGlobalSettingsState } from '../states/SettingsStates';
import { useUserState } from '../states/UserState';
import { aboutInvenTree, docLinks, licenseInfo, serverInfo } from './links';

function openQrModal(navigate: NavigateFunction) {
  return openContextModal({
    modal: 'qr',
    innerProps: { navigate: navigate }
  });
}

function openHotkeys() {
  return openContextModal({
    modal: 'hotkey',
    title: (
      <StylishText size='xl'>
        <Trans>Hotkeys</Trans>
      </StylishText>
    ),
    size: 'xl',
    innerProps: {}
  });
}

export function getActions(navigate: NavigateFunction) {
  const setNavigationOpen = useLocalState(
    useShallow((state) => state.setNavigationOpen)
  );
  const globalSettings = useGlobalSettingsState();
  const user = useUserState();

  const actions: SpotlightActionData[] = useMemo(() => {
    const staff = user?.isStaff() ?? false;

    const _actions: SpotlightActionData[] = [
      {
        id: 'dashboard',
        label: t`首页`,
        description: t`回到系统首页`,
        onClick: () => navigate('/'),
        leftSection: <IconLink size='1.2rem' />
      },
      {
        id: 'documentation',
        label: t`帮助文档`,
        description: t`查看系统使用说明`,
        onClick: () => {
          window.location.href = docLinks.faq;
        },
        leftSection: <IconLink size='1.2rem' />
      },
      {
        id: 'about',
        label: t`关于系统`,
        description: t`查看系统项目信息`,
        onClick: () => aboutInvenTree(),
        leftSection: <IconLink size='1.2rem' />
      },
      {
        id: 'server-info',
        label: t`服务器信息`,
        description: t`查看当前系统实例信息`,
        onClick: () => serverInfo(),
        leftSection: <IconLink size='1.2rem' />
      },
      {
        id: 'license-info',
        label: t`许可证信息`,
        description: t`查看系统依赖软件许可证`,
        onClick: () => licenseInfo(),
        leftSection: <IconLink size='1.2rem' />
      },
      {
        id: 'navigation',
        label: t`打开导航`,
        description: t`打开主导航菜单`,
        onClick: () => setNavigationOpen(true),
        leftSection: <IconPointer size='1.2rem' />
      },
      {
        id: 'user-settings',
        label: t`个人设置`,
        description: t`进入当前用户设置`,
        onClick: () => navigate('/settings/user'),
        leftSection: <IconUserCog size='1.2rem' />
      },
      {
        id: 'hotkeys',
        label: t`快捷键`,
        description: t`查看可用快捷键`,
        onClick: () => openHotkeys(),
        leftSection: <IconSettings size='1.2rem' />
      }
    ];

    staff &&
      _actions.push({
        id: 'data-import',
        label: t`导入数据`,
        description: t`从文件导入业务数据`,
        onClick: () => navigate('/settings/admin/import'),
        leftSection: <IconPlug size='1.2rem' />
      });

    // Page Actions
    user?.hasViewRole(UserRoles.purchase_order) &&
      _actions.push({
        id: 'purchase-orders',
        label: t`进货单`,
        description: t`进入进货单`,
        onClick: () =>
          navigate(ModelInformationDict['purchaseorder'].url_overview!),
        leftSection: <IconLink size='1.2rem' />
      });

    user?.hasViewRole(UserRoles.sales_order) &&
      _actions.push({
        id: 'sales-orders',
        label: t`出货单`,
        description: t`进入出货单`,
        onClick: () =>
          navigate(ModelInformationDict['salesorder'].url_overview!),
        leftSection: <IconLink size='1.2rem' />
      });

    globalSettings.isSet('TRANSFERORDER_ENABLED') &&
      user?.hasViewRole(UserRoles.transfer_order) &&
      _actions.push({
        id: 'transfer-orders',
        label: t`移库单`,
        description: t`进入移库单`,
        onClick: () =>
          navigate(ModelInformationDict['transferorder'].url_overview!),
        leftSection: <IconLink size='1.2rem' />
      });

    globalSettings.isSet('RETURNORDER_ENABLED') &&
      user?.hasViewRole(UserRoles.return_order) &&
      _actions.push({
        id: 'return-orders',
        label: t`退货单`,
        description: t`进入退货单`,
        onClick: () =>
          navigate(ModelInformationDict['returnorder'].url_overview!),
        leftSection: <IconLink size='1.2rem' />
      });

    globalSettings.isSet('BARCODE_ENABLE') &&
      _actions.push({
        id: 'scan',
        label: t`扫码`,
        description: t`扫描条码或二维码`,
        onClick: () => openQrModal(navigate),
        leftSection: <IconBarcode size='1.2rem' />
      });

    user?.hasViewRole(UserRoles.build) &&
      _actions.push({
        id: 'builds',
        label: t`组合配货单`,
        description: t`进入组合配货单`,
        onClick: () => navigate(ModelInformationDict['build'].url_overview!),
        leftSection: <IconLink size='1.2rem' />
      });

    staff &&
      _actions.push({
        id: 'system-settings',
        label: t`系统设置`,
        description: t`进入系统设置`,
        onClick: () => navigate('/settings/system'),
        leftSection: <IconSettings size='1.2rem' />
      });

    staff &&
      _actions.push({
        id: 'admin-center',
        label: t`管理中心`,
        description: t`进入管理中心`,
        onClick: () => navigate('/settings/admin'),
        leftSection: <IconUserBolt size='1.2rem' />
      });

    staff &&
      user?.hasViewPermission(ModelType.error) &&
      _actions.push({
        id: 'error-logs',
        label: t`错误日志`,
        description: t`查看当前系统错误日志`,
        onClick: () => navigate('/settings/admin/errors'),
        leftSection: <IconReport size='1.2rem' />
      });

    staff &&
      user?.hasViewPermission(ModelType.user) &&
      _actions.push({
        id: 'users',
        label: t`用户`,
        description: t`管理用户账号`,
        onClick: () => navigate('/settings/admin/user'),
        leftSection: <IconUsers size='1.2rem' />
      });

    staff &&
      user?.hasViewPermission(ModelType.pluginconfig) &&
      _actions.push({
        id: 'plugin-settings',
        label: t`插件`,
        description: t`管理系统插件`,
        onClick: () => navigate('/settings/admin/plugin'),
        leftSection: <IconPlug size='1.2rem' />
      });

    staff &&
      user?.hasViewPermission(ModelType.pluginconfig) &&
      _actions.push({
        id: 'machine-management',
        label: t`设备`,
        description: t`管理设备和设备类型`,
        onClick: () => navigate('/settings/admin/machine'),
        leftSection: <IconDevicesPc size='1.2rem' />
      });

    staff &&
      user?.hasViewPermission(ModelType.reporttemplate) &&
      _actions.push({
        id: 'report-templates',
        label: t`报表模板`,
        description: t`管理报表模板`,
        onClick: () => navigate('/settings/admin/reports'),
        leftSection: <IconReport size='1.2rem' />
      });

    staff &&
      user?.hasViewPermission(ModelType.labeltemplate) &&
      _actions.push({
        id: 'label-templates',
        label: t`标签模板`,
        description: t`管理标签模板`,
        onClick: () => navigate('/settings/admin/labels'),
        leftSection: <IconTags size='1.2rem' />
      });

    return _actions;
  }, [navigate, setNavigationOpen, globalSettings, user]);

  return actions.sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
}
