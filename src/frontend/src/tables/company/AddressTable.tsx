import { t } from '@lingui/core/macro';
import { useCallback, useMemo, useState } from 'react';

import { AddItemButton } from '@lib/components/AddItemButton';
import {
  type RowAction,
  RowDeleteAction,
  RowEditAction
} from '@lib/components/RowActions';
import { YesNoButton } from '@lib/components/YesNoButton';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import useTable from '@lib/hooks/UseTable';
import type { ApiFormFieldSet } from '@lib/types/Forms';
import type { TableColumn } from '@lib/types/Tables';
import {
  useCreateApiFormModal,
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useUserState } from '../../states/UserState';
import { LinkColumn } from '../ColumnRenderers';
import { InvenTreeTable } from '../InvenTreeTable';

export function AddressTable({
  companyId,
  params
}: Readonly<{
  companyId: number;
  params?: any;
}>) {
  const user = useUserState();

  const table = useTable('address');

  const columns: TableColumn[] = useMemo(() => {
    return [
      {
        accessor: 'title',
        title: t`地址名称`,
        sortable: true,
        switchable: false
      },
      {
        accessor: 'primary',
        title: t`默认地址`,
        switchable: false,
        sortable: false,
        render: (record: any) => YesNoButton({ value: record.primary })
      },
      {
        accessor: 'address',
        title: t`地址`,
        sortable: false,
        switchable: false,
        render: (record: any) => {
          let address = '';

          if (record?.line1) {
            address += record.line1;
          }

          if (record?.line2) {
            address += ` ${record.line2}`;
          }

          return address.trim();
        }
      },
      {
        accessor: 'postal_code',
        title: t`邮编`,
        sortable: false,
        switchable: true
      },
      {
        accessor: 'postal_city',
        title: t`城市`,
        sortable: false,
        switchable: true
      },
      {
        accessor: 'province',
        title: t`省份`,
        sortable: false,
        switchable: true
      },
      {
        accessor: 'country',
        title: t`国家/地区`,
        sortable: false,
        switchable: true
      },
      {
        accessor: 'shipping_notes',
        title: t`送货备注`,
        sortable: false,
        switchable: true
      },
      {
        accessor: 'internal_shipping_notes',
        title: t`内部送货备注`,
        sortable: false,
        switchable: true
      },
      LinkColumn({})
    ];
  }, []);

  const addressFields: ApiFormFieldSet = useMemo(() => {
    return {
      company: { label: t`往来单位` },
      title: { label: t`地址名称` },
      primary: { label: t`默认地址` },
      line1: { label: t`地址第一行` },
      line2: { label: t`地址第二行` },
      postal_code: { label: t`邮编` },
      postal_city: { label: t`城市` },
      province: { label: t`省份` },
      country: { label: t`国家/地区` },
      shipping_notes: { label: t`送货备注` },
      internal_shipping_notes: { label: t`内部送货备注` },
      link: { label: t`外部链接` }
    };
  }, []);

  const newAddress = useCreateApiFormModal({
    url: ApiEndpoints.address_list,
    title: t`新增地址`,
    fields: addressFields,
    initialData: {
      company: companyId
    },
    successMessage: t`地址已新增`,
    table: table
  });

  const [selectedAddress, setSelectedAddress] = useState<number>(-1);

  const editAddress = useEditApiFormModal({
    url: ApiEndpoints.address_list,
    pk: selectedAddress,
    title: t`编辑地址`,
    fields: addressFields,
    table: table
  });

  const deleteAddress = useDeleteApiFormModal({
    url: ApiEndpoints.address_list,
    pk: selectedAddress,
    title: t`删除地址`,
    preFormWarning: t`确认删除这个地址？`,
    table: table
  });

  const rowActions = useCallback(
    (record: any): RowAction[] => {
      const can_edit =
        user.hasChangeRole(UserRoles.purchase_order) ||
        user.hasChangeRole(UserRoles.sales_order);

      const can_delete =
        user.hasDeleteRole(UserRoles.purchase_order) ||
        user.hasDeleteRole(UserRoles.sales_order);

      return [
        RowEditAction({
          hidden: !can_edit,
          onClick: () => {
            setSelectedAddress(record.pk);
            editAddress.open();
          }
        }),
        RowDeleteAction({
          hidden: !can_delete,
          onClick: () => {
            setSelectedAddress(record.pk);
            deleteAddress.open();
          }
        })
      ];
    },
    [user]
  );

  const tableActions = useMemo(() => {
    const can_add =
      user.hasChangeRole(UserRoles.purchase_order) ||
      user.hasChangeRole(UserRoles.sales_order);

    return [
      <AddItemButton
        key='add-address'
        tooltip={t`新增地址`}
        onClick={() => newAddress.open()}
        hidden={!can_add}
      />
    ];
  }, [user]);

  return (
    <>
      {newAddress.modal}
      {editAddress.modal}
      {deleteAddress.modal}
      <InvenTreeTable
        url={apiUrl(ApiEndpoints.address_list)}
        tableState={table}
        columns={columns}
        props={{
          enableDownload: true,
          rowActions: rowActions,
          tableActions: tableActions,
          params: {
            ...params,
            company: companyId
          }
        }}
      />
    </>
  );
}
