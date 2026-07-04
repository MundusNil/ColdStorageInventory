import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import { getDetailUrl } from '@lib/functions/Navigation';
import type { TableFilter } from '@lib/index';
import type { StockOperationProps } from '@lib/types/Forms';
import type { PanelType } from '@lib/types/Panel';
import { t } from '@lingui/core/macro';
import { Group, Skeleton, Stack } from '@mantine/core';
import {
  IconCalendar,
  IconInfoCircle,
  IconListDetails,
  IconPackages,
  IconSitemap,
  IconTable,
  IconTransfer
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../App';
import { useBarcodeScanDialog } from '../../components/barcodes/BarcodeScanDialog';
import AdminButton from '../../components/buttons/AdminButton';
import { PrintingActions } from '../../components/buttons/PrintingActions';
import OrderCalendar from '../../components/calendar/OrderCalendar';
import {
  type DetailsField,
  DetailsTable
} from '../../components/details/Details';
import { ItemDetailsGrid } from '../../components/details/ItemDetails';
import {
  BarcodeActionDropdown,
  DeleteItemAction,
  EditItemAction,
  OptionsActionDropdown
} from '../../components/items/ActionDropdown';
import { ApiIcon } from '../../components/items/ApiIcon';
import InstanceDetail from '../../components/nav/InstanceDetail';
import NavigationTree from '../../components/nav/NavigationTree';
import { PageDetail } from '../../components/nav/PageDetail';
import { PanelGroup } from '../../components/panels/PanelGroup';
import ParametersPanel from '../../components/panels/ParametersPanel';
import SegmentedControlPanel from '../../components/panels/SegmentedControlPanel';
import LocateItemButton from '../../components/plugins/LocateItemButton';
import { stockLocationFields } from '../../forms/StockForms';
import { InvenTreeIcon } from '../../functions/icons';
import {
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useInstance } from '../../hooks/UseInstance';
import { useStockAdjustActions } from '../../hooks/UseStockAdjustActions';
import { useUserSettingsState } from '../../states/SettingsStates';
import { useGlobalSettingsState } from '../../states/SettingsStates';
import { useUserState } from '../../states/UserState';
import { PartListTable } from '../../tables/part/PartTable';
import { StockItemTable } from '../../tables/stock/StockItemTable';
import StockLocationParametricTable from '../../tables/stock/StockLocationParametricTable';
import { StockLocationTable } from '../../tables/stock/StockLocationTable';
import TransferOrderParametricTable from '../../tables/stock/TransferOrderParametricTable';
import { TransferOrderTable } from '../../tables/stock/TransferOrderTable';

function TransferOrderCalendar() {
  const calendarFilters: TableFilter[] = useMemo(() => {
    return [];
  }, []);

  return (
    <OrderCalendar
      model={ModelType.transferorder}
      role={UserRoles.transfer_order}
      params={{}}
      filters={calendarFilters}
      initialFilters={[{ name: 'outstanding', value: 'true' }]}
    />
  );
}

export default function Stock() {
  const { id: _id } = useParams();

  const id = useMemo(
    () => (!Number.isNaN(Number.parseInt(_id || '')) ? _id : undefined),
    [_id]
  );

  const navigate = useNavigate();
  const user = useUserState();
  const settings = useUserSettingsState();
  const globalSettings = useGlobalSettingsState();

  const [treeOpen, setTreeOpen] = useState(false);

  const {
    instance: location,
    refreshInstance,
    instanceQuery
  } = useInstance({
    endpoint: ApiEndpoints.stock_location_list,
    hasPrimaryKey: true,
    pk: id,
    params: {
      path_detail: true
    }
  });

  const detailsPanel = useMemo(() => {
    if (id && instanceQuery.isFetching) {
      return <Skeleton />;
    }

    const left: DetailsField[] = [
      {
        type: 'text',
        name: 'name',
        label: t`库位名称`,
        copy: true,
        value_formatter: () => (
          <Group gap='xs'>
            {location.icon && <ApiIcon name={location.icon} />}
            {location.name}
          </Group>
        )
      },
      {
        type: 'text',
        name: 'pathstring',
        label: t`完整库位`,
        icon: 'sitemap',
        copy: true,
        hidden: !id
      },
      {
        type: 'text',
        name: 'description',
        label: t`说明`,
        copy: true
      },
      {
        type: 'link',
        name: 'parent',
        model_field: 'name',
        icon: 'location',
        label: t`上级库位`,
        model: ModelType.stocklocation,
        hidden: !location?.parent
      }
    ];

    const right: DetailsField[] = [
      {
        type: 'text',
        name: 'items',
        icon: 'stock',
        label: t`库存批次`,
        value_formatter: () => location?.items || '0'
      },
      {
        type: 'text',
        name: 'sublocations',
        icon: 'location',
        label: t`下级库位`,
        hidden: !location?.sublocations
      },
      {
        type: 'boolean',
        name: 'structural',
        label: t`分区节点`,
        icon: 'sitemap'
      },
      {
        type: 'boolean',
        name: 'external',
        label: t`外部库位`
      },
      {
        type: 'string',
        // TODO: render location type icon here (ref: #7237)
        name: 'location_type_detail.name',
        label: t`库位类型`,
        hidden: !location?.location_type,
        icon: 'packages'
      }
    ];

    return (
      <ItemDetailsGrid>
        {id && location?.pk && <DetailsTable item={location} fields={left} />}
        {id && location?.pk && <DetailsTable item={location} fields={right} />}
      </ItemDetailsGrid>
    );
  }, [location, instanceQuery]);

  const [sublocationView, setSublocationView] = useState<string>('table');
  const [transferOrderView, setTransferOrderView] = useState<string>('table');

  const locationPanels: PanelType[] = useMemo(() => {
    return [
      {
        name: 'details',
        label: t`库位详情`,
        icon: <IconInfoCircle />,
        content: detailsPanel,
        hidden: !location?.pk
      },
      SegmentedControlPanel({
        name: 'sublocations',
        label: id ? t`下级库位` : t`冷库库位`,
        icon: <IconSitemap />,
        hidden: !user.hasViewPermission(ModelType.stocklocation),
        selection: sublocationView,
        onChange: setSublocationView,
        options: [
          {
            value: 'table',
            label: t`表格视图`,
            icon: <IconTable />,
            content: <StockLocationTable parentId={id} />
          },
          {
            value: 'parametric',
            label: t`参数视图`,
            icon: <IconListDetails />,
            content: (
              <StockLocationParametricTable
                queryParams={id ? { parent: id } : {}}
              />
            )
          }
        ]
      }),
      {
        name: 'stock-items',
        label: t`库存批次`,
        icon: <IconPackages />,
        content: (
          <StockItemTable
            tableName='location-stock'
            allowAdd
            params={{
              location: id
            }}
          />
        )
      },
      SegmentedControlPanel({
        name: 'transfer-orders',
        label: t`移库单`,
        icon: <IconTransfer />,
        hidden:
          !user.hasViewRole(UserRoles.transfer_order) ||
          !globalSettings.isSet('TRANSFERORDER_ENABLED'),
        selection: transferOrderView,
        onChange: setTransferOrderView,
        options: [
          {
            value: 'table',
            label: t`表格视图`,
            icon: <IconTable />,
            content: <TransferOrderTable />
          },
          {
            value: 'calendar',
            label: t`日历视图`,
            icon: <IconCalendar />,
            content: <TransferOrderCalendar />
          },
          {
            value: 'parametric',
            label: t`参数视图`,
            icon: <IconListDetails />,
            content: <TransferOrderParametricTable />
          }
        ]
      }),
      {
        name: 'default_parts',
        label: t`默认存放货品`,
        icon: <IconPackages />,
        hidden: !location.pk,
        content: (
          <PartListTable
            props={{
              params: {
                default_location: location.pk
              }
            }}
          />
        )
      },
      ParametersPanel({
        model_type: ModelType.stocklocation,
        model_id: location.pk,
        hidden: !location.pk
      })
    ];
  }, [sublocationView, transferOrderView, location, id]);

  const editLocation = useEditApiFormModal({
    url: ApiEndpoints.stock_location_list,
    pk: id,
    title: t`编辑冷库库位`,
    fields: stockLocationFields(),
    onFormSuccess: refreshInstance
  });

  const deleteOptions = useMemo(() => {
    return [
      {
        value: 'false',
        display_name: t`移动库存到上级库位`
      },
      {
        value: 'true',
        display_name: t`删除库存批次`
      }
    ];
  }, []);

  const deleteLocation = useDeleteApiFormModal({
    url: ApiEndpoints.stock_location_list,
    pk: id,
    title: t`删除冷库库位`,
    fields: {
      delete_stock_items: {
        label: t`库存处理方式`,
        required: true,
        description: t`当前库位中库存批次的处理方式`,
        field_type: 'choice',
        choices: deleteOptions
      },
      delete_sub_locations: {
        label: t`下级库位处理方式`,
        required: true,
        description: t`当前库位中下级库位的处理方式`,
        field_type: 'choice',
        choices: deleteOptions
      }
    },
    onFormSuccess: () => {
      if (location.parent) {
        navigate(getDetailUrl(ModelType.stocklocation, location.parent));
      } else {
        navigate('/stock/');
      }
    }
  });

  const stockOperationProps: StockOperationProps = useMemo(() => {
    return {
      refresh: refreshInstance,
      filters: {
        location: location.pk,
        in_stock: true
      }
    };
  }, [location]);

  const stockAdjustActions = useStockAdjustActions({
    formProps: stockOperationProps,
    enabled: true,
    changeBatch: false,
    delete: false,
    merge: false,
    assign: false
  });

  const scanInStockItem = useBarcodeScanDialog({
    title: t`扫描库存批次`,
    modelType: ModelType.stockitem,
    callback: async (barcode, response) => {
      const item = response.stockitem.instance;

      // Scan the stock item into the current location
      return api
        .post(apiUrl(ApiEndpoints.stock_transfer), {
          location: location.pk,
          items: [
            {
              pk: item.pk,
              quantity: item.quantity
            }
          ]
        })
        .then(() => {
          return {
            success: t`库存批次已扫描入库位`
          };
        })
        .catch((error) => {
          console.error('Error scanning stock item:', error);
          return {
            error: t`扫描库存批次失败`
          };
        });
    }
  });

  const scanInStockLocation = useBarcodeScanDialog({
    title: t`扫描冷库库位`,
    modelType: ModelType.stocklocation,
    callback: async (barcode, response) => {
      const pk = response.stocklocation.pk;

      // Set the parent location
      return api
        .patch(apiUrl(ApiEndpoints.stock_location_list, pk), {
          parent: location.pk
        })
        .then(() => {
          return {
            success: t`冷库库位已扫描到当前库位`
          };
        })
        .catch((error) => {
          console.error('Error scanning stock location:', error);
          return {
            error: t`扫描冷库库位失败`
          };
        });
    }
  });

  const locationActions = useMemo(
    () => [
      <AdminButton model={ModelType.stocklocation} id={location.pk} />,
      <LocateItemButton locationId={location.pk} />,
      location.pk ? (
        <BarcodeActionDropdown
          model={ModelType.stocklocation}
          pk={location.pk}
          hash={location?.barcode_hash}
          perm={user.hasChangeRole(UserRoles.stock_location)}
          actions={[
            {
              name: t`扫码入库`,
              icon: <InvenTreeIcon icon='stock' />,
              tooltip: t`扫描库存批次到当前库位`,
              onClick: scanInStockItem.open
            },
            {
              name: t`扫码加入库位`,
              icon: <InvenTreeIcon icon='unallocated_stock' />,
              tooltip: t`扫描容器或库位到当前库位`,
              onClick: scanInStockLocation.open
            }
          ]}
        />
      ) : null,
      <PrintingActions
        modelType={ModelType.stocklocation}
        items={[location.pk ?? 0]}
        hidden={!location?.pk}
        enableLabels
        enableReports
      />,
      stockAdjustActions.dropdown,
      <OptionsActionDropdown
        tooltip={t`库位操作`}
        actions={[
          EditItemAction({
            hidden: !id || !user.hasChangeRole(UserRoles.stock_location),
            tooltip: t`编辑冷库库位`,
            onClick: () => editLocation.open()
          }),
          DeleteItemAction({
            hidden: !id || !user.hasDeleteRole(UserRoles.stock_location),
            tooltip: t`删除冷库库位`,
            onClick: () => deleteLocation.open()
          })
        ]}
      />
    ],
    [location, id, user, stockAdjustActions.dropdown]
  );

  const breadcrumbs = useMemo(
    () => [
      { name: t`库存`, url: '/stock' },
      ...(location.path ?? []).map((l: any) => ({
        name: l.name,
        url: getDetailUrl(ModelType.stocklocation, l.pk),
        icon: l.icon ? <ApiIcon name={l.icon} /> : undefined
      }))
    ],
    [location]
  );

  const defaultPanel = useMemo(() => {
    if (
      settings.isSet('DISPLAY_ITEMS_FINAL_LEVEL', true) &&
      location.pk &&
      location.sublocations === 0
    ) {
      return 'stock-items';
    }
    return undefined;
  }, [settings, location]);

  return (
    <>
      {editLocation.modal}
      {deleteLocation.modal}
      {scanInStockItem.dialog}
      {scanInStockLocation.dialog}
      <InstanceDetail
        query={instanceQuery}
        requiredRole={UserRoles.stock_location}
      >
        <Stack>
          <NavigationTree
            title={t`冷库库位`}
            modelType={ModelType.stocklocation}
            endpoint={ApiEndpoints.stock_location_tree}
            childIdentifier='sublocations'
            opened={treeOpen}
            onClose={() => setTreeOpen(false)}
            selectedId={location?.pk}
          />
          <PageDetail
            title={(location?.name ?? id) ? t`冷库库位` : t`库存`}
            subtitle={location?.description}
            icon={location?.icon && <ApiIcon name={location?.icon} />}
            actions={location?.pk ? locationActions : undefined}
            editAction={editLocation.open}
            editEnabled={
              !!location?.pk &&
              user.hasChangePermission(ModelType.stocklocation)
            }
            breadcrumbs={breadcrumbs}
            lastCrumb={[
              {
                name: location.name,
                url: `/stock/location/${location.pk}/`
              }
            ]}
            breadcrumbAction={() => {
              setTreeOpen(true);
            }}
          />
          <PanelGroup
            pageKey='stocklocation'
            panels={locationPanels}
            model={ModelType.stocklocation}
            reloadInstance={refreshInstance}
            id={location?.pk}
            instance={location}
            pluginPanelWithoutId
            defaultPanel={defaultPanel}
          />
        </Stack>
        {stockAdjustActions.modals.map((modal) => modal.modal)}
      </InstanceDetail>
    </>
  );
}
