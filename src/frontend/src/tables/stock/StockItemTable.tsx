import { t } from '@lingui/core/macro';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ActionButton } from '@lib/components/ActionButton';
import { AddItemButton } from '@lib/components/AddItemButton';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import { getDetailUrl } from '@lib/functions/Navigation';
import useTable from '@lib/hooks/UseTable';
import type { TableFilter } from '@lib/types/Filters';
import type { StockOperationProps } from '@lib/types/Forms';
import type { TableColumn } from '@lib/types/Tables';
import OrderPartsWizard from '../../components/wizards/OrderPartsWizard';
import { formatCurrency, formatPriceRange } from '../../defaults/formatters';
import { useStockFields } from '../../forms/StockForms';
import { InvenTreeIcon } from '../../functions/icons';
import { useCreateApiFormModal } from '../../hooks/UseForm';
import { useStockAdjustActions } from '../../hooks/UseStockAdjustActions';
import { useGlobalSettingsState } from '../../states/SettingsStates';
import { useUserState } from '../../states/UserState';
import {
  DateColumn,
  DescriptionColumn,
  IPNColumn,
  LocationColumn,
  PartColumn,
  StatusColumn,
  StockColumn
} from '../ColumnRenderers';
import {
  BatchFilter,
  CreatedAfterFilter,
  CreatedBeforeFilter,
  HasBatchCodeFilter,
  InStockFilter,
  IncludeVariantsFilter,
  IsSerializedFilter,
  ManufacturerFilter,
  SerialFilter,
  SerialGTEFilter,
  SerialLTEFilter,
  StatusFilterOptions,
  SupplierFilter,
  TagsFilter,
  UpdatedAfterFilter,
  UpdatedBeforeFilter
} from '../Filter';
import { InvenTreeTable } from '../InvenTreeTable';

/**
 * Construct a list of columns for the stock item table
 */
function stockItemTableColumns({
  showLocation,
  showPricing
}: {
  showLocation: boolean;
  showPricing: boolean;
}): TableColumn[] {
  return [
    PartColumn({
      accessor: 'part',
      part: 'part_detail',
      filter: ['active']
    }),
    IPNColumn({}),
    {
      accessor: 'part_detail.revision',
      title: t`规格版本`,
      sortable: true,
      defaultVisible: false
    },
    DescriptionColumn({
      accessor: 'part_detail.description'
    }),
    StockColumn({
      accessor: '',
      title: t`库存`,
      sortable: true,
      ordering: 'stock',
      filter: [
        'available',
        'allocated',
        'consumed',
        'installed',
        'in_stock',
        'sent_to_customer'
      ]
    }),
    StatusColumn({ model: ModelType.stockitem }),
    {
      accessor: 'batch',
      title: t`批次`,
      sortable: true,
      copyable: true,
      filter: ['has_batch_code', 'batch']
    },
    LocationColumn({
      hidden: !showLocation,
      accessor: 'location_detail'
    }),
    {
      accessor: 'purchase_order',
      title: t`进货单`,
      defaultVisible: false,
      render: (record: any) => {
        return record.purchase_order_reference;
      }
    },
    {
      accessor: 'SKU',
      title: t`供货商货号`,
      sortable: true,
      defaultVisible: false,
      copyable: true
    },
    {
      accessor: 'MPN',
      title: t`厂家货号`,
      sortable: true,
      defaultVisible: false,
      copyable: true
    },
    {
      accessor: 'purchase_price',
      title: t`进货单价`,
      sortable: true,
      switchable: true,
      hidden: !showPricing,
      defaultVisible: false,
      render: (record: any) =>
        formatCurrency(record.purchase_price, {
          currency: record.purchase_price_currency
        })
    },
    {
      accessor: 'stock_value',
      title: t`库存金额`,
      sortable: false,
      hidden: !showPricing,
      render: (record: any) => {
        const min_price =
          record.purchase_price || record.part_detail?.pricing_min;
        const max_price =
          record.purchase_price || record.part_detail?.pricing_max;
        const currency = record.purchase_price_currency || undefined;

        return formatPriceRange(min_price, max_price, {
          currency: currency,
          multiplier: record.quantity
        });
      }
    },
    {
      accessor: 'packaging',
      title: t`包装`,
      sortable: true,
      defaultVisible: false
    },
    DateColumn({
      title: t`创建日期`,
      accessor: 'creation_date',
      sortable: true,
      filter: ['created_before', 'created_after']
    }),
    DateColumn({
      title: t`最后更新`,
      accessor: 'updated',
      filter: ['updated_before', 'updated_after']
    }),
    DateColumn({
      title: t`到期日期`,
      accessor: 'expiry_date',
      hidden: !useGlobalSettingsState.getState().isSet('STOCK_ENABLE_EXPIRY'),
      defaultVisible: false,
      filter: ['stale', 'expiry_before', 'expiry_after']
    }),
    DateColumn({
      accessor: 'stocktake_date',
      title: t`盘点日期`,
      sortable: true,
      filter: ['has_stocktake', 'stocktake_before', 'stocktake_after']
    })
  ];
}

/**
 * Construct a list of available filters for the stock item table
 */
function stockItemTableFilters({
  enableExpiry
}: {
  enableExpiry: boolean;
}): TableFilter[] {
  return [
    {
      name: 'active',
      label: t`启用货品`,
      description: t`只看已启用货品的库存`
    },
    {
      name: 'status',
      label: t`库存状态`,
      description: t`按库存状态筛选`,
      choiceFunction: StatusFilterOptions(ModelType.stockitem)
    },
    {
      name: 'assembly',
      label: t`组合货品`,
      description: t`显示组合货品库存`
    },
    {
      name: 'allocated',
      label: t`已占用`,
      description: t`显示已被单据占用的库存`
    },
    {
      name: 'available',
      label: t`可用`,
      description: t`显示可用库存`
    },
    {
      name: 'cascade',
      label: t`包含下级库位`,
      description: t`包含下级库位中的库存`
    },
    {
      name: 'depleted',
      label: t`已清空`,
      description: t`显示已清空的库存批次`
    },
    InStockFilter(),
    {
      name: 'is_building',
      label: t`组合配货中`,
      description: t`显示正在组合配货的库存`
    },
    IncludeVariantsFilter(),
    SupplierFilter(),
    ManufacturerFilter(),
    {
      name: 'consumed',
      label: t`已消耗`,
      description: t`显示已被组合配货单消耗的库存`
    },
    {
      name: 'installed',
      label: t`已关联`,
      description: t`显示已关联到其他库存批次的库存`
    },
    {
      name: 'sent_to_customer',
      label: t`已发给客户`,
      description: t`显示已发给客户的库存`
    },
    HasBatchCodeFilter(),
    BatchFilter(),
    IsSerializedFilter(),
    SerialFilter(),
    SerialLTEFilter(),
    SerialGTEFilter(),
    {
      name: 'tracked',
      label: t`可追踪`,
      description: t`显示可追踪的库存批次`
    },
    {
      name: 'has_purchase_price',
      label: t`有进价`,
      description: t`显示录入了进价的库存`
    },
    {
      name: 'expired',
      label: t`已过期`,
      description: t`显示已过期库存`,
      active: enableExpiry
    },
    {
      name: 'stale',
      label: t`长期未盘点`,
      description: t`显示长期未盘点的库存`,
      active: enableExpiry
    },
    {
      name: 'expiry_before',
      label: t`到期早于`,
      description: t`显示在此日期前到期的库存`,
      type: 'date',
      active: enableExpiry
    },
    {
      name: 'expiry_after',
      label: t`到期晚于`,
      description: t`显示在此日期后到期的库存`,
      type: 'date',
      active: enableExpiry
    },
    UpdatedBeforeFilter(),
    UpdatedAfterFilter(),
    CreatedBeforeFilter(),
    CreatedAfterFilter(),
    {
      name: 'stocktake_before',
      label: t`盘点早于`,
      description: t`显示在此日期前盘点的库存`,
      type: 'date'
    },
    {
      name: 'stocktake_after',
      label: t`盘点晚于`,
      description: t`显示在此日期后盘点的库存`,
      type: 'date'
    },
    {
      name: 'has_stocktake',
      label: t`有盘点日期`,
      description: t`显示已有盘点日期的库存`
    },
    {
      name: 'external',
      label: t`外部库位`,
      description: t`显示外部库位中的库存`
    },
    TagsFilter({ modelType: ModelType.stockitem })
  ];
}

/*
 * Load a table of stock items
 */
export function StockItemTable({
  params = {},
  allowAdd = false,
  showLocation = true,
  showPricing = true,
  allowReturn = false,
  initialFilters,
  defaultInStock = true,
  tableName = 'stockitems',
  readOnly = false
}: Readonly<{
  params?: any;
  allowAdd?: boolean;
  showLocation?: boolean;
  showPricing?: boolean;
  allowReturn?: boolean;
  readOnly?: boolean;
  defaultInStock?: boolean | null;
  initialFilters?: TableFilter[];
  tableName: string;
}>) {
  const initialStockFilters: TableFilter[] = useMemo(() => {
    if (!!initialFilters) {
      return initialFilters;
    }

    const filters: TableFilter[] = [];

    // Optionally set the default "in_stock" filter
    // Typically, we default to only displaying "in_stock" items,
    // but this can be overridden by the caller if required
    if (defaultInStock != undefined && defaultInStock != null) {
      filters.push({
        name: 'in_stock',
        value: defaultInStock ? 'true' : 'false'
      });
    }

    return filters;
  }, [defaultInStock, initialFilters]);

  const table = useTable(tableName, {
    initialFilters: initialStockFilters
  });

  const user = useUserState();

  const settings = useGlobalSettingsState();

  const stockExpiryEnabled = useMemo(
    () => settings.isSet('STOCK_ENABLE_EXPIRY'),
    [settings]
  );

  const navigate = useNavigate();

  const tableColumns = useMemo(
    () =>
      stockItemTableColumns({
        showLocation: showLocation ?? true,
        showPricing: showPricing ?? true
      }),
    [showLocation, showPricing]
  );

  const tableFilters: TableFilter[] = useMemo(
    () =>
      stockItemTableFilters({
        enableExpiry: stockExpiryEnabled
      }),
    [stockExpiryEnabled]
  );

  const stockOperationProps: StockOperationProps = useMemo(() => {
    return {
      items: table.selectedRecords,
      model: ModelType.stockitem,
      refresh: () => {
        table.clearSelectedRecords();
        table.refreshTable();
      },
      filters: {
        in_stock: true
      }
    };
  }, [table.selectedRecords, table.refreshTable]);

  const newStockItemFields = useStockFields({
    create: true,
    partId: params.part,
    supplierPartId: params.supplier_part,
    pricing: params.pricing,
    modalId: 'add-stock-item'
  });

  const newStockItem = useCreateApiFormModal({
    url: ApiEndpoints.stock_item_list,
    title: t`新增库存批次`,
    modalId: 'add-stock-item',
    fields: newStockItemFields,
    initialData: {
      part: params.part,
      location: params.location
    },
    follow: params.openNewStockItem ?? true,
    table: table,
    onFormSuccess: (response: any) => {
      // Returns a list that may contain multiple serialized stock items
      // Navigate to the first result
      navigate(getDetailUrl(ModelType.stockitem, response[0].pk));
    },
    successMessage: t`库存批次已创建`,
    keepOpenOption: true
  });

  const [partsToOrder, setPartsToOrder] = useState<any[]>([]);

  const orderPartsWizard = OrderPartsWizard({
    parts: partsToOrder
  });

  const stockAdjustActions = useStockAdjustActions({
    formProps: stockOperationProps,
    return: allowReturn,
    changeBatch: true
  });

  const tableActions = useMemo(() => {
    return [
      stockAdjustActions.dropdown,
      <ActionButton
        key='stock-order'
        hidden={!user.hasAddRole(UserRoles.purchase_order)}
        tooltip={t`生成进货单`}
        icon={<InvenTreeIcon icon='buy' />}
        disabled={!table.hasSelectedRecords}
        onClick={() => {
          setPartsToOrder(
            table.selectedRecords.map((record) => record.part_detail)
          );
          orderPartsWizard.openWizard();
        }}
      />,
      <AddItemButton
        key='add-stock-item'
        hidden={!allowAdd || !user.hasAddRole(UserRoles.stock)}
        tooltip={t`新增库存批次`}
        onClick={() => newStockItem.open()}
      />
    ];
  }, [
    user,
    allowAdd,
    table.hasSelectedRecords,
    table.selectedRecords,
    stockAdjustActions.dropdown
  ]);

  return (
    <>
      {newStockItem.modal}
      {orderPartsWizard.wizard}
      {!readOnly && stockAdjustActions.modals.map((modal) => modal.modal)}
      <InvenTreeTable
        url={apiUrl(ApiEndpoints.stock_item_list)}
        tableState={table}
        columns={tableColumns}
        props={{
          enableDownload: !readOnly,
          enableSelection: !readOnly,
          enableLabels: !readOnly,
          enableReports: !readOnly,
          tableFilters: tableFilters,
          tableActions: readOnly ? [] : tableActions,
          modelType: ModelType.stockitem,
          params: {
            ...params,
            part_detail: true,
            location_detail: true,
            supplier_part_detail: true
          }
        }}
      />
    </>
  );
}
