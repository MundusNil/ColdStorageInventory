import { t } from '@lingui/core/macro';
import { Text } from '@mantine/core';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { ActionButton } from '@lib/components/ActionButton';
import { AddItemButton } from '@lib/components/AddItemButton';
import {
  type RowAction,
  RowDeleteAction,
  RowDuplicateAction,
  RowEditAction
} from '@lib/components/RowActions';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import useTable from '@lib/hooks/UseTable';
import type { TableFilter } from '@lib/types/Filters';
import type { TableColumn } from '@lib/types/Tables';
import { IconPackageImport } from '@tabler/icons-react';
import ImportPartWizard from '../../components/wizards/ImportPartWizard';
import { useSupplierPartFields } from '../../forms/CompanyForms';
import {
  useCreateApiFormModal,
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { usePluginsWithMixin } from '../../hooks/UsePlugins';
import { useUserState } from '../../states/UserState';
import {
  BooleanColumn,
  CompanyColumn,
  DecimalColumn,
  DescriptionColumn,
  IPNColumn,
  LinkColumn,
  NoteColumn,
  PartColumn
} from '../ColumnRenderers';
import { TagsFilter } from '../Filter';
import { InvenTreeTable } from '../InvenTreeTable';
import { TableHoverCard } from '../TableHoverCard';

/*
 * Construct a table listing supplier parts
 */

export function SupplierPartTable({
  manufacturerId,
  manufacturerPartId,
  partId,
  supplierId
}: Readonly<{
  manufacturerId?: number;
  manufacturerPartId?: number;
  partId?: number;
  supplierId?: number;
}>): ReactNode {
  const initialFilters = useMemo(() => {
    const filters: TableFilter[] = [
      {
        name: 'active',
        value: 'true'
      },
      TagsFilter({ modelType: ModelType.supplierpart })
    ];

    if (!supplierId) {
      filters.push({
        name: 'supplier_active',
        value: 'true'
      });
    }

    if (!partId) {
      filters.push({
        name: 'part_active',
        value: 'true'
      });
    }

    return filters;
  }, [supplierId, partId]);

  const table = useTable('supplierparts', {
    initialFilters: initialFilters
  });

  const user = useUserState();

  // Construct table columns for this table
  const tableColumns: TableColumn[] = useMemo(() => {
    return [
      PartColumn({
        switchable: !!partId,
        part: 'part_detail',
        filter: ['part_active']
      }),
      IPNColumn({}),
      {
        accessor: 'supplier',
        title: t`供货商`,
        filter: 'supplier_active',
        sortable: true,
        render: (record: any) => (
          <CompanyColumn company={record?.supplier_detail} />
        )
      },
      {
        accessor: 'SKU',
        title: t`供货商货品`,
        sortable: true,
        copyable: true
      },
      DescriptionColumn({}),
      {
        accessor: 'manufacturer',
        title: t`生产厂家/品牌`,
        sortable: true,
        render: (record: any) => (
          <CompanyColumn company={record?.manufacturer_detail} />
        )
      },
      {
        accessor: 'MPN',
        sortable: true,
        title: t`厂家货号`,
        render: (record: any) => record?.manufacturer_part_detail?.MPN,
        copyable: true,
        copyAccessor: 'manufacturer_part_detail.MPN'
      },
      BooleanColumn({
        accessor: 'primary',
        title: t`首选供货商`,
        sortable: true,
        switchable: true,
        defaultVisible: false
      }),
      BooleanColumn({
        accessor: 'active',
        title: t`启用`,
        sortable: true,
        switchable: true,
        defaultVisible: false
      }),
      DecimalColumn({
        accessor: 'in_stock',
        title: t`当前库存`,
        sortable: true
      }),
      {
        accessor: 'packaging',
        title: t`包装说明`,
        sortable: true,
        defaultVisible: false
      },
      {
        accessor: 'pack_quantity',
        title: t`包装数量`,
        sortable: true,
        render: (record: any) => {
          const part = record?.part_detail ?? {};

          const extra = [];

          if (part.units) {
            extra.push(
              <Text key='base' size='sm'>
                {t`基础单位`} : {part.units}
              </Text>
            );
          }

          return (
            <TableHoverCard
              value={record.pack_quantity}
              extra={extra}
              title={t`包装数量`}
            />
          );
        }
      },
      LinkColumn({}),
      NoteColumn({}),
      {
        accessor: 'available',
        title: t`可供数量`,
        sortable: true,
        defaultVisible: false,
        filter: 'has_stock',
        render: (record: any) => {
          const extra = [];

          if (record.availablility_updated) {
            extra.push(
              <Text>
                {t`更新时间`} : {record.availablility_updated}
              </Text>
            );
          }

          return <TableHoverCard value={record.available} extra={extra} />;
        }
      }
    ];
  }, [partId]);

  const supplierPartFields = useSupplierPartFields({
    partId: partId
  });

  const addSupplierPart = useCreateApiFormModal({
    url: ApiEndpoints.supplier_part_list,
    title: t`新增供货商货品`,
    fields: supplierPartFields,
    initialData: {
      part: partId,
      supplier: supplierId,
      manufacturer_part: manufacturerPartId
    },
    onFormSuccess: (response: any) => {
      table.refreshTable();
    },
    successMessage: t`供货商货品已新增`,
    keepOpenOption: true
  });

  const supplierPlugins = usePluginsWithMixin('supplier');
  const importPartWizard = ImportPartWizard({
    partId: partId
  });

  const tableActions = useMemo(() => {
    return [
      <AddItemButton
        key='add-supplier-part'
        tooltip={t`新增供货商货品`}
        onClick={() => addSupplierPart.open()}
        hidden={!user.hasAddRole(UserRoles.purchase_order)}
      />,
      <ActionButton
        key='import-part'
        icon={<IconPackageImport />}
        color='green'
        tooltip={t`导入供货商货品`}
        onClick={() => importPartWizard.openWizard()}
        hidden={
          supplierPlugins.length === 0 ||
          !user.hasAddRole(UserRoles.part) ||
          !partId
        }
      />
    ];
  }, [user, partId, supplierPlugins]);

  const tableFilters: TableFilter[] = useMemo(() => {
    return [
      {
        name: 'active',
        label: t`启用`,
        description: t`只显示启用的供货商货品`
      },
      {
        name: 'primary',
        label: t`首选供货商`,
        description: t`只显示首选供货商货品`
      },
      {
        name: 'part_active',
        label: t`启用货品`,
        description: t`只显示启用的货品`
      },
      {
        name: 'supplier_active',
        label: t`启用供货商`,
        description: t`只显示启用的供货商`
      },
      {
        name: 'has_stock',
        label: t`有库存`,
        description: t`只显示当前有库存的供货商货品`
      }
    ];
  }, []);

  const editSupplierPartFields = useSupplierPartFields({});

  const [selectedSupplierPart, setSelectedSupplierPart] =
    useState<any>(undefined);

  const editSupplierPart = useEditApiFormModal({
    url: ApiEndpoints.supplier_part_list,
    pk: selectedSupplierPart?.pk,
    title: t`编辑供货商货品`,
    fields: useMemo(() => editSupplierPartFields, [editSupplierPartFields]),
    onFormSuccess: (response: any) => {
      table.refreshTable();
    }
  });

  const duplicateSupplierPartFields = useSupplierPartFields({
    duplicateSupplierPartId: selectedSupplierPart?.pk
  });

  const duplicateSupplierPart = useCreateApiFormModal({
    url: ApiEndpoints.supplier_part_list,
    title: t`新增供货商货品`,
    fields: duplicateSupplierPartFields,
    initialData: {
      ...selectedSupplierPart,
      primary: false,
      active: true
    },
    onFormSuccess: (response: any) => {
      table.refreshTable();
    },
    successMessage: t`供货商货品已新增`
  });

  const deleteSupplierPart = useDeleteApiFormModal({
    url: ApiEndpoints.supplier_part_list,
    pk: selectedSupplierPart?.pk,
    title: t`删除供货商货品`,
    table: table
  });

  // Row action callback
  const rowActions = useCallback(
    (record: any): RowAction[] => {
      return [
        RowEditAction({
          hidden: !user.hasChangeRole(UserRoles.purchase_order),
          onClick: () => {
            setSelectedSupplierPart(record);
            editSupplierPart.open();
          }
        }),
        RowDuplicateAction({
          hidden: !user.hasAddRole(UserRoles.purchase_order),
          onClick: () => {
            setSelectedSupplierPart(record);
            duplicateSupplierPart.open();
          }
        }),
        RowDeleteAction({
          hidden: !user.hasDeleteRole(UserRoles.purchase_order),
          onClick: () => {
            setSelectedSupplierPart(record);
            deleteSupplierPart.open();
          }
        })
      ];
    },
    [user, editSupplierPartFields]
  );

  return (
    <>
      {addSupplierPart.modal}
      {editSupplierPart.modal}
      {duplicateSupplierPart.modal}
      {deleteSupplierPart.modal}
      {importPartWizard.wizard}
      <InvenTreeTable
        url={apiUrl(ApiEndpoints.supplier_part_list)}
        tableState={table}
        columns={tableColumns}
        props={{
          params: {
            manufacturer: manufacturerId,
            manufacturer_part: manufacturerPartId,
            supplier: supplierId,
            part: partId,
            part_detail: true,
            supplier_detail: true,
            manufacturer_detail: true,
            manufacturer_part_detail: true
          },
          rowActions: rowActions,
          enableDownload: true,
          tableActions: tableActions,
          tableFilters: tableFilters,
          modelType: ModelType.supplierpart
        }}
      />
    </>
  );
}
