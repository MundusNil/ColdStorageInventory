import { t } from '@lingui/core/macro';
import { Group, Tooltip } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
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
import { partCategoryFields } from '../../forms/PartForms';
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
 * PartCategoryTable - Displays a table of part categories
 */
export function PartCategoryTable({ parentId }: Readonly<{ parentId?: any }>) {
  const table = useTable('partcategory');
  const user = useUserState();

  const tableColumns: TableColumn[] = useMemo(() => {
    return [
      {
        accessor: 'name',
        title: t`分类名称`,
        sortable: true,
        switchable: false,
        copyable: true,
        render: (record: any) => (
          <Group gap='xs' wrap='nowrap' justify='space-between'>
            <Group gap='xs' wrap='nowrap'>
              {record.icon && <ApiIcon name={record.icon} />}
              {record.name}
            </Group>
            <Group gap='xs' justify='flex-end' wrap='nowrap'>
              {record.starred && (
                <Tooltip
                  label={t`你已订阅此分类的通知`}
                >
                  <IconBell color='green' size={16} />
                </Tooltip>
              )}
            </Group>
          </Group>
        )
      },
      DescriptionColumn({}),
      {
        accessor: 'pathstring',
        title: t`完整分类`,
        copyable: true,
        sortable: true
      },
      BooleanColumn({
        accessor: 'structural',
        title: t`分类节点`,
        sortable: true,
        defaultVisible: false
      }),
      {
        accessor: 'part_count',
        title: t`货品数`,
        sortable: true
      }
    ];
  }, []);

  const tableFilters: TableFilter[] = useMemo(() => {
    return [
      {
        name: 'cascade',
        label: t`包含下级分类`,
        description: t`结果中包含下级分类`
      },
      {
        name: 'structural',
        label: t`分类节点`,
        description: t`显示仅用于分组的分类`
      },
      {
        name: 'starred',
        label: t`已订阅`,
        description: t`显示当前用户订阅的分类`
      }
    ];
  }, []);

  const newCategoryFields = partCategoryFields({ create: true });

  const newCategory = useCreateApiFormModal({
    url: ApiEndpoints.category_list,
    title: t`新增货品分类`,
    fields: newCategoryFields,
    focus: 'name',
    initialData: {
      parent: parentId
    },
    follow: true,
    modelType: ModelType.partcategory,
    table: table,
    keepOpenOption: true
  });

  const [selectedCategory, setSelectedCategory] = useState<number>(-1);

  const editCategoryFields = partCategoryFields({ create: false });

  const editCategory = useEditApiFormModal({
    url: ApiEndpoints.category_list,
    pk: selectedCategory,
    title: t`编辑货品分类`,
    fields: editCategoryFields,
    onFormSuccess: (record: any) => table.updateRecord(record)
  });

  const setParent = useBulkEditApiFormModal({
    url: ApiEndpoints.category_list,
    items: table.selectedIds,
    title: t`设置上级分类`,
    fields: {
      parent: {
        label: t`上级分类`
      }
    },
    onFormSuccess: table.refreshTable
  });

  const tableActions = useMemo(() => {
    const can_add = user.hasAddRole(UserRoles.part_category);
    const can_edit = user.hasChangeRole(UserRoles.part_category);

    return [
      <ActionDropdown
        tooltip={t`分类操作`}
        icon={<InvenTreeIcon icon='category' />}
        disabled={!table.hasSelectedRecords}
        actions={[
          {
            name: t`设置上级分类`,
            icon: <InvenTreeIcon icon='category' />,
            tooltip: t`给选中分类设置上级分类`,
            hidden: !can_edit,
            disabled: !table.hasSelectedRecords,
            onClick: () => {
              setParent.open();
            }
          }
        ]}
      />,
      <AddItemButton
        key='add-part-category'
        tooltip={t`新增货品分类`}
        onClick={() => newCategory.open()}
        hidden={!can_add}
      />
    ];
  }, [user, table.hasSelectedRecords]);

  const rowActions = useCallback(
    (record: any): RowAction[] => {
      const can_edit = user.hasChangeRole(UserRoles.part_category);

      return [
        RowEditAction({
          hidden: !can_edit,
          onClick: () => {
            setSelectedCategory(record.pk);
            editCategory.open();
          }
        })
      ];
    },
    [user]
  );

  return (
    <>
      {newCategory.modal}
      {editCategory.modal}
      {setParent.modal}
      <InvenTreeTable
        url={apiUrl(ApiEndpoints.category_list)}
        tableState={table}
        columns={tableColumns}
        props={{
          enableDownload: true,
          enableSelection: true,
          params: {
            parent: parentId,
            top_level: parentId === undefined ? true : undefined
          },
          tableFilters: tableFilters,
          tableActions: tableActions,
          rowActions: rowActions,
          modelType: ModelType.partcategory
        }}
      />
    </>
  );
}
