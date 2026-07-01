import { Badge, Box, Group, Stack, Switch, Text } from '@mantine/core';
import { SearchInput } from '@lib/components/SearchInput';

import { ApiEndpoints, apiUrl } from '@lib/index';
import useTable from '@lib/hooks/UseTable';
import type { TableColumn } from '@lib/types/Tables';
import { useState } from 'react';
import { InvenTreeTable } from '../../tables/InvenTreeTable';

function renderText(value: any) {
  return value || '-';
}

function renderQuantity(record: any) {
  const quantity = record.quantity ?? '-';
  const units = record.part_detail?.units;

  return (
    <Group gap={6} wrap='nowrap'>
      <Text fw={600}>{quantity}</Text>
      {units && (
        <Text size='sm' c='dimmed'>
          {units}
        </Text>
      )}
    </Group>
  );
}

function renderStatus(record: any) {
  const status = record.status_text || record.status_custom_key || '-';

  return (
    <Badge color='green' variant='light'>
      {status}
    </Badge>
  );
}

function getColumns(): TableColumn[] {
  return [
    {
      accessor: 'part_detail.name',
      title: '货品',
      sortable: true,
      render: (record: any) => renderText(record.part_detail?.name)
    },
    {
      accessor: 'quantity',
      title: '数量',
      sortable: true,
      render: renderQuantity
    },
    {
      accessor: 'location_detail.pathstring',
      title: '库位',
      sortable: true,
      render: (record: any) =>
        renderText(record.location_detail?.pathstring || record.location_detail?.name)
    },
    {
      accessor: 'batch',
      title: '批次',
      sortable: true,
      render: (record: any) => renderText(record.batch)
    },
    {
      accessor: 'expiry_date',
      title: '到期日期',
      sortable: true,
      render: (record: any) => renderText(record.expiry_date)
    },
    {
      accessor: 'status_text',
      title: '状态',
      render: renderStatus
    }
  ];
}

export default function ColdStorageStockTable() {
  const [onlyInStock, setOnlyInStock] = useState(true);
  const table = useTable('cold-storage-simple-stockitems');
  const columns = getColumns();

  return (
    <Stack gap='sm'>
      <Group justify='space-between' align='flex-end' gap='md'>
        <Box style={{ flex: 1, minWidth: 280 }}>
          <SearchInput
            placeholder='输入货品、库位或批次'
            searchCallback={(value) => table.setSearchTerm(value)}
          />
        </Box>
        <Switch
          checked={onlyInStock}
          label='只看有库存'
          onChange={(event) => {
            setOnlyInStock(event.currentTarget.checked);
            table.setPage(1);
            table.refreshTable();
          }}
        />
      </Group>
      <InvenTreeTable
        url={apiUrl(ApiEndpoints.stock_item_list)}
        tableState={table}
        columns={columns}
        props={{
          enableSelection: false,
          enableDownload: false,
          enableLabels: false,
          enableReports: false,
          enableColumnSwitching: false,
          enableColumnCaching: false,
          enableFilters: true,
          enableSearch: false,
          enableRefresh: true,
          params: {
            part_detail: true,
            location_detail: true,
            ...(onlyInStock ? { in_stock: true } : {})
          }
        }}
      />
    </Stack>
  );
}
