import { t } from '@lingui/core/macro';
import { Group } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';

import { AddItemButton } from '@lib/components/AddItemButton';
import { type RowAction, RowEditAction } from '@lib/components/RowActions';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import useTable from '@lib/hooks/UseTable';
import type { TableFilter } from '@lib/types/Filters';
import type { TableColumn } from '@lib/types/Tables';
import { ActionDropdown } from '../../components/items/ActionDropdown';
import { ApiIcon } from '../../components/items/ApiIcon';
import { stockLocationFields } from '../../forms/StockForms';
import { InvenTreeIcon } from '../../functions/icons';
import {
  useBulkEditApiFormModal,
  useCreateApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useUserState } from '../../states/UserState';
import { BooleanColumn, DescriptionColumn } from '../ColumnRenderers';
import { InvenTreeTable } from '../InvenTreeTable';

/**
 * Stock location table
 */
export function StockLocationTable({ parentId }: Readonly<{ parentId?: any }>) {
  const table = useTable('stocklocation');
  const user = useUserState();

  const tableFilters: TableFilter[] = useMemo(() => {
    return [
      {
        name: 'cascade',
        label: t`包含下级库位`,
        description: t`结果中包含下级库位`
      },
      {
        name: 'structural',
        label: t`分区节点`,
        description: t`显示仅用于分区的库位`
      },
      {
        name: 'external',
        label: t`外部库位`,
        description: t`显示外部库位`
      },
      {
        name: 'has_location_type',
        label: t`有库位类型`
      },
      {
        name: 'location_type',
        label: t`库位类型`,
        description: t`按库位类型筛选`,
        apiUrl: apiUrl(ApiEndpoints.stock_location_type_list),
        model: ModelType.stocklocationtype,
        modelRenderer: (instance: any) => instance.name
      }
    ];
  }, []);

  const tableColumns: TableColumn[] = useMemo(() => {
    return [
      {
        accessor: 'name',
        title: t`库位名称`,
        switchable: false,
        copyable: true,
        render: (record: any) => (
          <Group gap='xs'>
            {record.icon && <ApiIcon name={record.icon} />}
            {record.name}
          </Group>
        )
      },
      DescriptionColumn({}),
      {
        accessor: 'pathstring',
        title: t`完整库位`,
        copyable: true,
        sortable: true
      },
      {
        accessor: 'items',
        title: t`库存批次数`,
        sortable: true
      },
      BooleanColumn({
        accessor: 'structural',
        title: t`分区节点`,
        defaultVisible: false
      }),
      BooleanColumn({
        accessor: 'external',
        title: t`外部库位`,
        defaultVisible: false
      }),
      {
        accessor: 'location_type',
        title: t`库位类型`,
        sortable: false,
        filter: ['has_location_type', 'location_type'],
        render: (record: any) => record.location_type_detail?.name
      }
    ];
  }, []);

  const newLocation = useCreateApiFormModal({
    url: ApiEndpoints.stock_location_list,
    title: t`新增冷库库位`,
    fields: stockLocationFields(),
    focus: 'name',
    initialData: {
      parent: parentId
    },
    follow: true,
    modelType: ModelType.stocklocation,
    table: table,
    keepOpenOption: true
  });

  const [selectedLocation, setSelectedLocation] = useState<number>(-1);

  const editLocation = useEditApiFormModal({
    url: ApiEndpoints.stock_location_list,
    pk: selectedLocation,
    title: t`编辑冷库库位`,
    fields: stockLocationFields(),
    onFormSuccess: (record: any) => table.updateRecord(record)
  });

  const setParent = useBulkEditApiFormModal({
    url: ApiEndpoints.stock_location_list,
    items: table.selectedIds,
    title: t`设置上级库位`,
    fields: {
      parent: {
        label: t`上级库位`
      }
    },
    onFormSuccess: table.refreshTable
  });

  const tableActions = useMemo(() => {
    const can_add = user.hasAddRole(UserRoles.stock_location);
    const can_edit = user.hasChangeRole(UserRoles.stock_location);

    return [
      <ActionDropdown
        tooltip={t`库位操作`}
        icon={<InvenTreeIcon icon='location' />}
        disabled={!table.hasSelectedRecords}
        actions={[
          {
            name: t`设置上级库位`,
            icon: <InvenTreeIcon icon='location' />,
            tooltip: t`给选中库位设置上级库位`,
            hidden: !can_edit,
            disabled: !table.hasSelectedRecords,
            onClick: () => {
              setParent.open();
            }
          }
        ]}
      />,
      <AddItemButton
        key='add-stock-location'
        tooltip={t`新增冷库库位`}
        onClick={() => newLocation.open()}
        hidden={!can_add}
      />
    ];
  }, [user, table.hasSelectedRecords]);

  const rowActions = useCallback(
    (record: any): RowAction[] => {
      const can_edit = user.hasChangeRole(UserRoles.stock_location);

      return [
        RowEditAction({
          hidden: !can_edit,
          onClick: () => {
            setSelectedLocation(record.pk);
            editLocation.open();
          }
        })
      ];
    },
    [user]
  );

  return (
    <>
      {newLocation.modal}
      {editLocation.modal}
      {setParent.modal}
      <InvenTreeTable
        url={apiUrl(ApiEndpoints.stock_location_list)}
        tableState={table}
        columns={tableColumns}
        props={{
          enableSelection: true,
          enableDownload: true,
          enableLabels: true,
          enableReports: true,
          params: {
            parent: parentId,
            top_level: parentId === undefined ? true : undefined
          },
          tableFilters: tableFilters,
          tableActions: tableActions,
          rowActions: rowActions,
          modelType: ModelType.stocklocation
        }}
      />
    </>
  );
}
