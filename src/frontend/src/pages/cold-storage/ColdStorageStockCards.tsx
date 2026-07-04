import {
  Alert,
  Badge,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  ThemeIcon,
  Title
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowsExchange,
  IconCalendarDue,
  IconClipboardCheck,
  IconMapPin,
  IconPackage,
  IconPackageExport,
  IconRefresh,
  IconSearch,
  IconTrash
} from '@tabler/icons-react';
import { ApiEndpoints, apiUrl } from '@lib/index';
import { useCallback, useEffect, useState } from 'react';

import { useApi } from '../../contexts/ApiContext';
import {
  displayStockQuantity,
  displayStockStatus,
  displayText
} from './coldStorageDisplay';

export type ColdStorageStockRecord = {
  pk: number;
  quantity?: number | string;
  batch?: string;
  expiry_date?: string;
  location?: number | string;
  status?: number | string;
  status_text?: string;
  status_custom_key?: string;
  packaging?: string;
  part_detail?: {
    name?: string;
    full_name?: string;
    units?: string;
  };
  location_detail?: {
    name?: string;
    pathstring?: string;
  };
};

type ColdStorageStockCardsProps = {
  refreshSignal?: number;
  onRemoveStock?: (item: ColdStorageStockRecord) => void;
  onTransferStock?: (item: ColdStorageStockRecord) => void;
  onCountStock?: (item: ColdStorageStockRecord) => void;
  onWasteStock?: (item: ColdStorageStockRecord) => void;
};

function isExpired(date?: string) {
  if (!date) {
    return false;
  }

  const expiry = new Date(date);

  if (Number.isNaN(expiry.getTime())) {
    return false;
  }

  return expiry.getTime() < new Date().setHours(0, 0, 0, 0);
}

function StockCard({
  item,
  onRemoveStock,
  onTransferStock,
  onCountStock,
  onWasteStock
}: {
  item: ColdStorageStockRecord;
  onRemoveStock?: (item: ColdStorageStockRecord) => void;
  onTransferStock?: (item: ColdStorageStockRecord) => void;
  onCountStock?: (item: ColdStorageStockRecord) => void;
  onWasteStock?: (item: ColdStorageStockRecord) => void;
}) {
  const partName = displayText(
    item.part_detail?.full_name || item.part_detail?.name,
    '未命名货品'
  );
  const location = displayText(
    item.location_detail?.pathstring || item.location_detail?.name,
    '未填写库位'
  );
  const batch = displayText(item.batch, '无批次号');
  const expiry = displayText(item.expiry_date, '未填到期日');
  const expired = isExpired(item.expiry_date);
  const status = displayStockStatus(item);

  return (
    <Paper withBorder radius='md' p='md'>
      <Stack gap='sm'>
        <Group justify='space-between' align='flex-start' gap='sm'>
          <Group gap='sm' align='flex-start' wrap='nowrap'>
            <ThemeIcon size={42} radius='md' variant='light' color='teal'>
              <IconPackage size={26} />
            </ThemeIcon>
            <Box>
              <Title order={3} size='h4'>
                {partName}
              </Title>
              <Text size='sm' c='dimmed'>
                {status}
              </Text>
            </Box>
          </Group>
          <Badge color={expired ? 'red' : 'green'} variant='light' size='lg'>
            {expired ? '已过期' : '可用'}
          </Badge>
        </Group>

        <Text fw={700} size='xl'>
          {displayStockQuantity(item)}
        </Text>

        <Stack gap={6}>
          <Group gap={6} wrap='nowrap'>
            <IconMapPin size={18} />
            <Text size='sm'>{location}</Text>
          </Group>
          <Group gap={6} wrap='nowrap'>
            <IconPackage size={18} />
            <Text size='sm'>批次号：{batch}</Text>
          </Group>
          <Group gap={6} wrap='nowrap'>
            <IconCalendarDue size={18} />
            <Text size='sm'>到期：{expiry}</Text>
          </Group>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='xs'>
          {onRemoveStock && (
            <Button
              variant='light'
              color='orange'
              fullWidth
              leftSection={<IconPackageExport size={18} />}
              onClick={() => onRemoveStock(item)}
            >
              出库扣数
            </Button>
          )}
          {onTransferStock && (
            <Button
              variant='light'
              color='violet'
              fullWidth
              leftSection={<IconArrowsExchange size={18} />}
              onClick={() => onTransferStock(item)}
            >
              改库位
            </Button>
          )}
          {onCountStock && (
            <Button
              variant='light'
              color='grape'
              fullWidth
              leftSection={<IconClipboardCheck size={18} />}
              onClick={() => onCountStock(item)}
            >
              盘点改数
            </Button>
          )}
          {onWasteStock && (
            <Button
              variant='light'
              color='red'
              fullWidth
              leftSection={<IconTrash size={18} />}
              onClick={() => onWasteStock(item)}
            >
              报损/过期
            </Button>
          )}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}

export default function ColdStorageStockCards({
  refreshSignal,
  onRemoveStock,
  onTransferStock,
  onCountStock,
  onWasteStock
}: ColdStorageStockCardsProps) {
  const api = useApi();
  const [items, setItems] = useState<ColdStorageStockRecord[]>([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await api.get(apiUrl(ApiEndpoints.stock_item_list), {
        params: {
          limit: 24,
          offset: 0,
          part_detail: true,
          location_detail: true,
          ...(onlyInStock ? { in_stock: true } : {}),
          ...(query ? { search: query } : {})
        }
      });

      const data = response.data;
      const results = Array.isArray(data) ? data : (data?.results ?? []);

      setItems(results);
      setRecordCount(
        Array.isArray(data) ? results.length : (data?.count ?? results.length)
      );
    } catch (err: any) {
      console.error('读取冷库库存失败:', err);
      setItems([]);
      setRecordCount(0);
      setError(
        '库存数据读取失败，请确认后端服务已启动，并且当前账号有库存查看权限。'
      );
    } finally {
      setLoading(false);
    }
  }, [api, onlyInStock, query]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock, refreshSignal]);

  return (
    <Stack gap='md'>
      <Group justify='space-between' align='flex-end' gap='md'>
        <TextInput
          label='查库存'
          placeholder='手动输入货品、库位或批次号'
          leftSection={<IconSearch size={20} />}
          size='lg'
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          style={{ flex: 1, minWidth: 280 }}
        />
        <Group gap='md' wrap='nowrap'>
          <Switch
            checked={onlyInStock}
            label='只看有库存'
            onChange={(event) => setOnlyInStock(event.currentTarget.checked)}
          />
          <Button
            variant='light'
            leftSection={<IconRefresh size={18} />}
            onClick={fetchStock}
          >
            刷新
          </Button>
        </Group>
      </Group>

      <Group justify='space-between' gap='sm'>
        <Text size='sm' c='dimmed'>
          最多显示前 24 条结果，继续输入可以缩小范围。
        </Text>
        <Badge variant='light' color='blue'>
          共 {recordCount} 条
        </Badge>
      </Group>

      {error && (
        <Alert color='red' icon={<IconAlertCircle />}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Center py='xl'>
          <Loader />
        </Center>
      ) : items.length > 0 ? (
        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing='md'>
          {items.map((item) => (
            <StockCard
              key={item.pk}
              item={item}
              onRemoveStock={onRemoveStock}
              onTransferStock={onTransferStock}
              onCountStock={onCountStock}
              onWasteStock={onWasteStock}
            />
          ))}
        </SimpleGrid>
      ) : (
        <Alert color='gray'>
          没有查到库存。换个货品名、库位或批次再试。
        </Alert>
      )}
    </Stack>
  );
}
