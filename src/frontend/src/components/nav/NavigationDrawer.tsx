import { t } from '@lingui/core/macro';
import { Container, Drawer, Flex, Group, Space } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';

import { StylishText } from '@lib/components/StylishText';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { AboutLinks, DocumentationLinks } from '../../defaults/links';
import useInstanceName from '../../hooks/UseInstanceName';
import * as classes from '../../main.css';
import { useGlobalSettingsState } from '../../states/SettingsStates';
import { useUserState } from '../../states/UserState';
import { InvenTreeLogo } from '../items/InvenTreeLogo';
import { type MenuLinkItem, MenuLinks } from '../items/MenuLinks';

// TODO @matmair #1: implement plugin loading and menu item generation see #5269
const plugins: MenuLinkItem[] = [];
const showLegacyBusinessLinks = false;

export function NavigationDrawer({
  opened,
  close
}: Readonly<{
  opened: boolean;
  close: () => void;
}>) {
  return (
    <Drawer
      opened={opened}
      onClose={close}
      size='lg'
      withCloseButton={false}
      classNames={{
        body: classes.navigationDrawer
      }}
    >
      <DrawerContent closeFunc={close} />
    </Drawer>
  );
}

function DrawerContent({ closeFunc }: Readonly<{ closeFunc?: () => void }>) {
  const user = useUserState();

  const globalSettings = useGlobalSettingsState();

  const [scrollHeight, setScrollHeight] = useState(0);
  const ref = useRef(null);
  const { height } = useViewportSize();

  const title = useInstanceName();

  // update scroll height when viewport size changes
  useEffect(() => {
    if (ref.current == null) return;
    setScrollHeight(height - ref.current['clientHeight'] - 65);
  });

  // Construct menu items
  const menuItemsNavigate: MenuLinkItem[] = useMemo(() => {
    return [
      {
        id: 'home',
        title: '首页',
        link: '/',
        icon: 'dashboard'
      },
      {
        id: 'cold-storage',
        title: '冷库工作台',
        link: '/cold-storage',
        icon: 'stock',
        hidden:
          !user.hasViewRole(UserRoles.stock) &&
          !user.hasViewRole(UserRoles.stock_location)
      },
      {
        id: 'parts',
        title: '货品',
        hidden: !user.hasViewPermission(ModelType.part),
        link: '/part',
        icon: 'part'
      },
      {
        id: 'stock',
        title: '库存',
        link: '/stock',
        hidden: !user.hasViewPermission(ModelType.stockitem),
        icon: 'stock'
      },
      {
        id: 'build',
        title: '组合配货',
        link: '/manufacturing/',
        hidden: !showLegacyBusinessLinks || !user.hasViewRole(UserRoles.build),
        icon: 'build'
      },
      {
        id: 'purchasing',
        title: '进货管理',
        link: '/purchasing/',
        hidden:
          !showLegacyBusinessLinks || !user.hasViewRole(UserRoles.purchase_order),
        icon: 'purchase_orders'
      },
      {
        id: 'sales',
        title: '出货管理',
        link: '/sales/',
        hidden:
          !showLegacyBusinessLinks || !user.hasViewRole(UserRoles.sales_order),
        icon: 'sales_orders'
      },
      {
        id: 'users',
        title: '用户',
        link: '/core/index/users',
        icon: 'user'
      },
      {
        id: 'groups',
        title: '用户组',
        link: '/core/index/groups',
        icon: 'group'
      }
    ];
  }, [user]);

  const menuItemsAction: MenuLinkItem[] = useMemo(() => {
    return [
      {
        id: 'barcode',
        title: '扫码',
        link: '/scan',
        icon: 'barcode',
        hidden: !globalSettings.isSet('BARCODE_ENABLE')
      }
    ];
  }, [user, globalSettings]);

  const menuItemsSettings: MenuLinkItem[] = useMemo(() => {
    return [
      {
        id: 'notifications',
        title: '通知',
        link: '/notifications',
        icon: 'notification'
      },
      {
        id: 'user-settings',
        title: '个人设置',
        link: '/settings/user',
        icon: 'user'
      },
      {
        id: 'system-settings',
        title: '系统设置',
        link: '/settings/system',
        icon: 'system',
        hidden: !user.isStaff()
      },
      {
        id: 'admin-center',
        title: '管理中心',
        link: '/settings/admin',
        icon: 'admin',
        hidden: !user.isStaff()
      }
    ];
  }, [user]);

  const menuItemsDocumentation: MenuLinkItem[] = useMemo(
    () => DocumentationLinks(),
    []
  );

  const menuItemsAbout: MenuLinkItem[] = useMemo(
    () => AboutLinks(globalSettings, user),
    []
  );

  return (
    <Flex direction='column' mih='100vh' p={16}>
      <Group wrap='nowrap'>
        <InvenTreeLogo />
        <StylishText size='xl'>{title}</StylishText>
      </Group>
      <Space h='xs' />
      <Container className={classes.layoutContent} p={0}>
        <MenuLinks
          title='导航'
          links={menuItemsNavigate}
          beforeClick={closeFunc}
        />
        <MenuLinks
          title='设置'
          links={menuItemsSettings}
          beforeClick={closeFunc}
        />
        <MenuLinks
          title='操作'
          links={menuItemsAction}
          beforeClick={closeFunc}
        />
        <Space h='md' />
        {plugins.length > 0 ? (
          <MenuLinks
            title={t`Plugins`}
            links={plugins}
            beforeClick={closeFunc}
          />
        ) : (
          <></>
        )}
      </Container>
      <div ref={ref}>
        <Space h='md' />
        <MenuLinks
          title='帮助文档'
          links={menuItemsDocumentation}
          beforeClick={closeFunc}
        />
        <Space h='md' />
        <MenuLinks
          title='关于系统'
          links={menuItemsAbout}
          beforeClick={closeFunc}
        />
      </div>
    </Flex>
  );
}
