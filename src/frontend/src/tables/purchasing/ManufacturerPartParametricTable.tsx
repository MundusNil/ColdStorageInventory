import { ApiEndpoints, ModelType } from '@lib/index';
import type { TableFilter } from '@lib/types/Filters';
import type { TableColumn } from '@lib/types/Tables';
import { t } from '@lingui/core/macro';
import { type ReactNode, useMemo } from 'react';
import { CompanyColumn, IPNColumn, PartColumn } from '../ColumnRenderers';
import ParametricDataTable from '../general/ParametricDataTable';

export default function ManufacturerPartParametricTable({
  queryParams
}: {
  queryParams?: Record<string, any>;
}): ReactNode {
  const customColumns: TableColumn[] = useMemo(() => {
    return [
      PartColumn({
        switchable: false
      }),
      IPNColumn({
        sortable: false
      }),
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
        title: t`厂家货号`,
        sortable: true,
        copyable: true
      }
    ];
  }, []);

  const customFilters: TableFilter[] = useMemo(() => {
    return [
      {
        name: 'part_active',
        label: t`启用货品`,
        description: t`只显示启用货品对应的生产厂家货号`,
        type: 'boolean'
      },
      {
        name: 'manufacturer_active',
        label: t`启用生产厂家/品牌`,
        description: t`只显示启用生产厂家/品牌对应的货号`,
        type: 'boolean'
      }
    ];
  }, []);

  return (
    <ParametricDataTable
      modelType={ModelType.manufacturerpart}
      endpoint={ApiEndpoints.manufacturer_part_list}
      customColumns={customColumns}
      customFilters={customFilters}
      queryParams={{
        ...queryParams,
        part_detail: true,
        manufacturer_detail: true
      }}
    />
  );
}
