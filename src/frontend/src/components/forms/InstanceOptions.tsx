import {
  ActionIcon,
  Divider,
  Group,
  Select,
  Table,
  Text,
  Tooltip
} from '@mantine/core';
import { useToggle } from '@mantine/hooks';
import {
  IconApi,
  IconCircleCheck,
  IconEdit,
  IconInfoCircle,
  IconPlugConnected,
  IconServer,
  IconServerSpark
} from '@tabler/icons-react';

import { ActionButton } from '@lib/components/ActionButton';
import type { HostList } from '@lib/types/Server';
import { useShallow } from 'zustand/react/shallow';
import { translateHostName } from '../../defaults/defaultHostList';
import { Wrapper } from '../../pages/Auth/Layout';
import { useLocalState } from '../../states/LocalState';
import { useServerApiState } from '../../states/ServerApiState';
import { HostOptionsForm } from './HostOptionsForm';

export function InstanceOptions({
  hostKey,
  ChangeHost,
  setHostEdit
}: Readonly<{
  hostKey: string;
  ChangeHost: (newHost: string | null) => void;
  setHostEdit: () => void;
}>) {
  const [hostListEdit, setHostListEdit] = useToggle([false, true] as const);
  const [setHost, setHostList, hostList] = useLocalState(
    useShallow((state) => [state.setHost, state.setHostList, state.hostList])
  );
  const hostListData = Object.keys(hostList).map((key) => ({
    value: key,
    label: translateHostName(hostList[key]?.name)
  }));

  function SaveOptions(newHostList: HostList): void {
    setHostList(newHostList);
    if (newHostList[hostKey] === undefined) {
      setHost('', '');
    }
    setHostListEdit();
  }

  return (
    <Wrapper titleText='选择服务器' smallPadding>
      <Group gap='xs' justify='space-between' wrap='nowrap'>
        <Select
          style={{ width: '100%' }}
          value={hostKey}
          onChange={ChangeHost}
          data={hostListData}
          disabled={hostListEdit}
        />
        <Group gap='xs' wrap='nowrap'>
          <Tooltip label='编辑服务器选项' position='top'>
            <ActionButton
              variant='transparent'
              disabled={hostListEdit}
              onClick={setHostListEdit}
              icon={<IconEdit />}
            />
          </Tooltip>
          <Tooltip label='确认服务器选择' position='top'>
            <ActionButton
              variant='transparent'
              onClick={setHostEdit}
              disabled={hostListEdit}
              icon={<IconCircleCheck />}
              color='green'
            />
          </Tooltip>
        </Group>
      </Group>

      {hostListEdit ? (
        <>
          <Divider my={'sm'} />
          <Text>
            编辑服务器选项
          </Text>
          <HostOptionsForm data={hostList} saveOptions={SaveOptions} />
        </>
      ) : (
        <>
          <Divider my={'sm'} />
          <ServerInfo hostList={hostList} hostKey={hostKey} />
        </>
      )}
    </Wrapper>
  );
}

function ServerInfo({
  hostList,
  hostKey
}: Readonly<{
  hostList: HostList;
  hostKey: string;
}>) {
  const [server] = useServerApiState(useShallow((state) => [state.server]));

  const items: any[] = [
    {
      key: 'server',
      label: '服务器',
      value: hostList[hostKey]?.host,
      icon: <IconServer />
    },
    {
      key: 'name',
      label: '名称',
      value: server.instance,
      icon: <IconInfoCircle />
    },
    {
      key: 'version',
      label: '版本',
      value: server.version,
      icon: <IconInfoCircle />
    },
    {
      key: 'api',
      label: 'API 版本',
      value: server.apiVersion,
      icon: <IconApi />
    },
    {
      key: 'plugins',
      label: '插件',
      value: server.plugins_enabled ? '已启用' : '已禁用',
      icon: <IconPlugConnected />,
      color: server.plugins_enabled ? 'green' : 'red'
    },
    {
      key: 'worker',
      label: '后台任务',
      value: server.worker_running ? '运行中' : '已停止',
      icon: <IconServerSpark />,
      color: server.worker_running ? 'green' : 'red'
    }
  ];

  return (
    <Table striped p='xs'>
      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr key={item.key} p={2}>
            <Table.Td>
              <ActionIcon size='xs' variant='transparent' color={item.color}>
                {item.icon}
              </ActionIcon>
            </Table.Td>
            <Table.Td>
              <Text size='sm'>{item.label}</Text>
            </Table.Td>
            <Table.Td>
              <Text size='sm'>{item.value}</Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
