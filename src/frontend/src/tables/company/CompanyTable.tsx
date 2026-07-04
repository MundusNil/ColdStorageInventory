import { t } from '@lingui/core/macro';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AddItemButton } from '@lib/components/AddItemButton';
import { type RowAction, RowEditAction } from '@lib/components/RowActions';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import { navigateToLink } from '@lib/functions/Navigation';
import useTable from '@lib/hooks/UseTable';
import type { TableFilter } from '@lib/types/Filters';
import { companyFields } from '../../forms/CompanyForms';
import {
  useCreateApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useUserState } from '../../states/UserState';
import {
  BooleanColumn,
  CompanyColumn,
  DescriptionColumn
} from '../ColumnRenderers';
import { TagsFilter } from '../Filter';
import { InvenTreeTable } from '../InvenTreeTable';

/**
 * A table which displays a list of company records,
 * based on the provided filter parameters
 */
export function CompanyTable({
  companyType,
  params,
  path
}: Readonly<{
  companyType?: string;
  params?: any;
  path?: string;
}>) {
  const table = useTable(`company-${companyType ?? 'index'}`, {
    initialFilters: [
      {
        name: 'active',
        value: 'true'
      }
    ]
  });

  const navigate = useNavigate();
  const user = useUserState();

  const columns = useMemo(() => {
    return [
      {
        accessor: 'name',
        title: t`往来单位`,
        sortable: true,
        switchable: false,
        render: (record: any) => {
          return <CompanyColumn company={record} />;
        }
      },
      DescriptionColumn({}),
      BooleanColumn({
        accessor: 'active',
        filter: 'active',
        title: t`启用`,
        sortable: true,
        switchable: true
      }),
      {
        accessor: 'website',
        title: t`网站`,
        sortable: false
      }
    ];
  }, []);

  const newCompany = useCreateApiFormModal({
    url: ApiEndpoints.company_list,
    title: t`新增往来单位`,
    fields: companyFields(),
    initialData: params,
    follow: true,
    modelType: ModelType.company,
    keepOpenOption: true
  });

  const [selectedCompany, setSelectedCompany] = useState<number>(0);

  const editCompany = useEditApiFormModal({
    url: ApiEndpoints.company_list,
    pk: selectedCompany,
    title: t`编辑往来单位`,
    fields: companyFields(),
    onFormSuccess: (record: any) => table.updateRecord(record)
  });

  const tableFilters: TableFilter[] = useMemo(() => {
    return [
      {
        name: 'active',
        label: t`启用`,
        description: t`显示启用的往来单位`
      },
      {
        name: 'is_supplier',
        label: t`供货商`,
        description: t`显示供货商单位`
      },
      {
        name: 'is_manufacturer',
        label: t`生产厂家/品牌`,
        description: t`显示生产厂家或品牌方`
      },
      {
        name: 'is_customer',
        label: t`客户`,
        description: t`显示客户单位`
      },
      TagsFilter({ modelType: ModelType.company })
    ];
  }, []);

  const tableActions = useMemo(() => {
    const can_add =
      user.hasAddRole(UserRoles.purchase_order) ||
      user.hasAddRole(UserRoles.sales_order);

    return [
      <AddItemButton
        key='add-company'
        tooltip={t`新增往来单位`}
        onClick={() => newCompany.open()}
        hidden={!can_add}
      />
    ];
  }, [user]);

  const rowActions = useCallback(
    (record: any): RowAction[] => {
      return [
        RowEditAction({
          hidden:
            !user.hasChangeRole(UserRoles.purchase_order) &&
            !user.hasChangeRole(UserRoles.sales_order),
          onClick: () => {
            setSelectedCompany(record.pk);
            editCompany.open();
          }
        })
      ];
    },
    [user]
  );

  return (
    <>
      {newCompany.modal}
      {editCompany.modal}
      <InvenTreeTable
        url={apiUrl(ApiEndpoints.company_list)}
        tableState={table}
        columns={columns}
        props={{
          params: {
            ...params
          },
          onRowClick: (record: any, index: number, event: any) => {
            if (record.pk) {
              const base = path ?? 'company';
              navigateToLink(`/${base}/${record.pk}`, navigate, event);
            }
          },
          modelType: ModelType.company,
          tableFilters: tableFilters,
          tableActions: tableActions,
          enableDownload: true,
          enableSelection: true,
          enableReports: true,
          rowActions: rowActions
        }}
      />
    </>
  );
}
