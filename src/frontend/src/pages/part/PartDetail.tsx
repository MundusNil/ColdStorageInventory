import { t } from '@lingui/core/macro';
import {
  ActionIcon,
  Alert,
  Center,
  Grid,
  Group,
  Loader,
  Paper,
  Skeleton,
  Stack,
  Text
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconBookmarks,
  IconBuilding,
  IconChecklist,
  IconClipboardList,
  IconCurrencyDollar,
  IconExclamationCircle,
  IconInfoCircle,
  IconLayersLinked,
  IconListDetails,
  IconListTree,
  IconLock,
  IconLockOpen,
  IconPackages,
  IconSearch,
  IconShoppingCart,
  IconStack2,
  IconTestPipe,
  IconTools,
  IconTransfer,
  IconTruckDelivery,
  IconTruckReturn,
  IconVersions
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Select from 'react-select';

import TagsList from '@lib/components/TagsList';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import { getDetailUrl } from '@lib/functions/Navigation';
import type { StockOperationProps } from '@lib/types/Forms';
import type { PanelType } from '@lib/types/Panel';
import AdminButton from '../../components/buttons/AdminButton';
import { PrintingActions } from '../../components/buttons/PrintingActions';
import StarredToggleButton from '../../components/buttons/StarredToggleButton';
import {
  type DetailsField,
  DetailsTable
} from '../../components/details/Details';
import DetailsBadge from '../../components/details/DetailsBadge';
import { DetailsImage } from '../../components/details/DetailsImage';
import { ItemDetailsGrid } from '../../components/details/ItemDetails';
import { Thumbnail } from '../../components/images/Thumbnail';
import {
  ActionDropdown,
  BarcodeActionDropdown,
  DeleteItemAction,
  DuplicateItemAction,
  EditItemAction,
  OptionsActionDropdown
} from '../../components/items/ActionDropdown';
import InstanceDetail from '../../components/nav/InstanceDetail';
import NavigationTree from '../../components/nav/NavigationTree';
import { PageDetail } from '../../components/nav/PageDetail';
import AttachmentPanel from '../../components/panels/AttachmentPanel';
import NotesPanel from '../../components/panels/NotesPanel';
import { PanelGroup } from '../../components/panels/PanelGroup';
import { RenderPart } from '../../components/render/Part';
import OrderPartsWizard from '../../components/wizards/OrderPartsWizard';
import { useApi } from '../../contexts/ApiContext';
import { formatDecimal, formatPriceRange } from '../../defaults/formatters';
import { usePartFields } from '../../forms/PartForms';
import { useFindSerialNumberForm } from '../../forms/StockForms';
import {
  useCreateApiFormModal,
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useInstance } from '../../hooks/UseInstance';
import { useStockAdjustActions } from '../../hooks/UseStockAdjustActions';
import {
  useGlobalSettingsState,
  useUserSettingsState
} from '../../states/SettingsStates';
import { useUserState } from '../../states/UserState';
import { BomTable } from '../../tables/bom/BomTable';
import { UsedInTable } from '../../tables/bom/UsedInTable';
import { BuildOrderTable } from '../../tables/build/BuildOrderTable';
import { ParameterTable } from '../../tables/general/ParameterTable';
import PartPurchaseOrdersTable from '../../tables/part/PartPurchaseOrdersTable';
import PartTestResultTable from '../../tables/part/PartTestResultTable';
import PartTestTemplateTable from '../../tables/part/PartTestTemplateTable';
import { PartVariantTable } from '../../tables/part/PartVariantTable';
import { RelatedPartTable } from '../../tables/part/RelatedPartTable';
import { ReturnOrderTable } from '../../tables/sales/ReturnOrderTable';
import { SalesOrderTable } from '../../tables/sales/SalesOrderTable';
import { StockItemTable } from '../../tables/stock/StockItemTable';
import { TransferOrderTable } from '../../tables/stock/TransferOrderTable';
import PartAllocationPanel from './PartAllocationPanel';
import PartPricingPanel from './PartPricingPanel';
import PartStockHistoryDetail from './PartStockHistoryDetail';
import PartSupplierDetail from './PartSupplierDetail';
import { BomActions } from './bom/BomActions';

/**
 * Render a part revision selector component
 */
function RevisionSelector({
  part,
  options
}: {
  part: any;
  options: any[];
}) {
  const navigate = useNavigate();

  return (
    <Select
      id='part-revision-select'
      aria-label='part-revision-select'
      options={options}
      value={{
        value: part.pk,
        label: part.full_name,
        part: part
      }}
      isSearchable={false}
      formatOptionLabel={(option: any) =>
        RenderPart({
          instance: option.part,
          showSecondary: false
        })
      }
      onChange={(value: any) => {
        navigate(getDetailUrl(ModelType.part, value.value));
      }}
      styles={{
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
        menu: (base: any) => ({ ...base, zIndex: 9999 }),
        menuList: (base: any) => ({ ...base, zIndex: 9999 })
      }}
    />
  );
}

/**
 * Detail view for a single Part instance
 */
export default function PartDetail() {
  const { id } = useParams();

  const api = useApi();
  const navigate = useNavigate();
  const user = useUserState();

  const [treeOpen, setTreeOpen] = useState(false);

  const globalSettings = useGlobalSettingsState();
  const userSettings = useUserSettingsState();

  // BOM validation information (used for hover-over info on the BOM tab)
  const bomInformation = useInstance({
    endpoint: ApiEndpoints.bom_validate,
    pk: id,
    hasPrimaryKey: true,
    refetchOnMount: true
  });

  const { instance: serials } = useInstance({
    endpoint: ApiEndpoints.part_serial_numbers,
    pk: id,
    hasPrimaryKey: true,
    refetchOnMount: false,
    defaultValue: {}
  });

  const {
    instance: part,
    refreshInstance,
    instanceQuery
  } = useInstance({
    endpoint: ApiEndpoints.part_list,
    pk: id,
    params: {
      path_detail: true,
      tags: true
    },
    refetchOnMount: true
  });

  const { instance: partRequirements, instanceQuery: partRequirementsQuery } =
    useInstance({
      endpoint: ApiEndpoints.part_requirements,
      pk: id,
      hasPrimaryKey: true,
      refetchOnMount: true
    });

  const lockingEnabled = useMemo(
    () => globalSettings.isSet('PART_ENABLE_LOCKING'),
    [globalSettings]
  );

  const revisionsEnabled = useMemo(
    () => globalSettings.isSet('PART_ENABLE_REVISION'),
    [globalSettings]
  );

  // Fetch information on parts which are revisions of *this* part
  const partRevisionQuery = useQuery({
    refetchOnMount: true,
    enabled:
      revisionsEnabled &&
      !!part &&
      (!!part.revision_count || !!part.revision_of),
    queryKey: ['part_revisions', part.pk, part.revision_count],
    queryFn: async () =>
      api
        .get(apiUrl(ApiEndpoints.part_list), {
          params: {
            revision_of: part.pk
          }
        })
        .then(async (response) => {
          let data = response.data;

          // If the part is also a revision, fetch upstream revision information too
          if (!!part.revision_of) {
            await api
              .get(apiUrl(ApiEndpoints.part_list), {
                params: {
                  revision_of: part.revision_of
                }
              })
              .then((response) => {
                data = [...data, ...response.data];
              });
          }
          return data;
        })
  });

  const partRevisionOptions: any[] = useMemo(() => {
    if (partRevisionQuery.isFetching || !partRevisionQuery.data) {
      return [];
    }

    if (!part.revision_of && !part.revision_count) {
      return [];
    }

    const options: any[] = partRevisionQuery.data.map((revision: any) => {
      return {
        value: revision.pk,
        label: revision.full_name,
        part: revision
      };
    });

    return options.sort((a, b) => {
      return `${a.part.revision}`.localeCompare(b.part.revision);
    });
  }, [part, partRevisionQuery.isFetching, partRevisionQuery.data]);

  const enableRevisionSelection: boolean = useMemo(() => {
    return partRevisionOptions.length > 0 && revisionsEnabled;
  }, [partRevisionOptions, revisionsEnabled]);

  const detailsPanel = useMemo(() => {
    if (instanceQuery.isFetching) {
      return <Skeleton />;
    }

    const data = { ...part };

    const fetching =
      partRequirementsQuery.isFetching || instanceQuery.isFetching;

    // Copy part requirements data into the main part data
    data.total_in_stock =
      partRequirements?.total_stock ?? part?.total_in_stock ?? 0;
    data.unallocated =
      partRequirements?.unallocated_stock ?? part?.unallocated_stock ?? 0;
    data.ordering = partRequirements?.ordering ?? part?.ordering ?? 0;

    data.required =
      (partRequirements?.required_for_build_orders ??
        part?.required_for_build_orders ??
        0) +
      (partRequirements?.required_for_sales_orders ??
        part?.required_for_sales_orders ??
        0);

    data.allocated =
      (partRequirements?.allocated_to_build_orders ??
        part?.allocated_to_build_orders ??
        0) +
      (partRequirements?.allocated_to_sales_orders ??
        part?.allocated_to_sales_orders ??
        0);

    // Extract requirements data
    data.can_build = partRequirements?.can_build ?? 0;

    // Provide latest serial number info
    if (!!serials.latest) {
      data.latest_serial_number = serials.latest;
    }

    // Top left - core part information
    const tl: DetailsField[] = [
      {
        type: 'string',
        name: 'name',
        label: t`Name`,
        icon: 'part',
        copy: true
      },
      {
        type: 'string',
        name: 'IPN',
        label: t`IPN`,
        copy: true,
        hidden: !part.IPN
      },
      {
        type: 'string',
        name: 'description',
        label: t`Description`,
        copy: true
      },
      {
        type: 'link',
        name: 'variant_of',
        label: t`Variant of`,
        model: ModelType.part,
        model_field: 'full_name',
        hidden: !part.variant_of
      },
      {
        type: 'link',
        name: 'revision_of',
        label: t`Revision of`,
        model: ModelType.part,
        model_field: 'full_name',
        hidden: !part.revision_of
      },
      {
        type: 'string',
        name: 'revision',
        label: t`Revision`,
        hidden: !part.revision,
        copy: true
      },
      {
        type: 'link',
        name: 'category',
        label: t`Category`,
        model: ModelType.partcategory
      },
      {
        type: 'link',
        name: 'default_location',
        label: t`Default Location`,
        model: ModelType.stocklocation,
        hidden: !part.default_location
      },
      {
        type: 'link',
        name: 'category_default_location',
        label: t`Category Default Location`,
        model: ModelType.stocklocation,
        hidden: part.default_location || !part.category_default_location
      },
      {
        type: 'string',
        name: 'units',
        label: t`Units`,
        copy: true,
        hidden: !part.units
      },
      {
        type: 'string',
        name: 'keywords',
        label: t`Keywords`,
        copy: true,
        hidden: !part.keywords
      },
      {
        type: 'link',
        name: 'link',
        label: t`Link`,
        external: true,
        copy: true,
        hidden: !part.link
      }
    ];

    // Top right - stock availability information
    const tr: DetailsField[] = [
      {
        type: 'number',
        name: 'total_in_stock',
        unit: part.units,
        label: t`In Stock`,
        hidden: part.virtual
      },
      {
        type: 'progressbar',
        name: 'unallocated_stock',
        total: data.total_in_stock,
        progress: data.unallocated,
        label: t`可用库存`,
        hidden: part.virtual || data.total_in_stock == data.unallocated
      },
      {
        type: 'number',
        name: 'ordering',
        label: t`进货在途`,
        unit: part.units,
        hidden: !part.purchaseable || part.ordering <= 0
      },
      {
        type: 'number',
        name: 'required',
        label: t`订单需求`,
        unit: part.units,
        hidden: data.required <= 0,
        icon: 'stocktake'
      },
      {
        type: 'progressbar',
        name: 'allocated_to_build_orders',
        icon: 'manufacturers',
        total: partRequirements.required_for_build_orders,
        progress: partRequirements.allocated_to_build_orders,
        label: t`组合配货占用`,
        hidden:
          fetching ||
          (partRequirements.required_for_build_orders <= 0 &&
            partRequirements.allocated_to_build_orders <= 0)
      },
      {
        type: 'progressbar',
        icon: 'sales_orders',
        name: 'allocated_to_sales_orders',
        total: partRequirements.required_for_sales_orders,
        progress: partRequirements.allocated_to_sales_orders,
        label: t`出货单占用`,
        hidden:
          fetching ||
          (partRequirements.required_for_sales_orders <= 0 &&
            partRequirements.allocated_to_sales_orders <= 0)
      },
      {
        type: 'progressbar',
        name: 'building',
        label: t`组合配货中`,
        progress: partRequirements.building,
        total: partRequirements.scheduled_to_build,
        hidden:
          fetching ||
          (!partRequirements.building && !partRequirements.scheduled_to_build)
      },
      {
        type: 'number',
        name: 'can_build',
        unit: part.units,
        label: t`可组合数量`,
        hidden: !part.assembly || fetching
      },
      {
        type: 'number',
        name: 'minimum_stock',
        unit: part.units,
        label: t`最低库存`,
        hidden: part.minimum_stock <= 0
      },
      {
        type: 'number',
        name: 'maximum_stock',
        unit: part.units,
        label: t`最高库存`,
        hidden: part.maximum_stock <= 0
      }
    ];

    // Bottom left - part attributes
    const bl: DetailsField[] = [
      {
        type: 'boolean',
        name: 'active',
        label: t`启用`
      },
      {
        type: 'boolean',
        name: 'locked',
        label: t`锁定`
      },
      {
        type: 'boolean',
        icon: 'template',
        name: 'is_template',
        label: t`模板货品`
      },
      {
        type: 'boolean',
        name: 'assembly',
        label: t`组合货品`
      },
      {
        type: 'boolean',
        name: 'component',
        label: t`可作为配货组成`
      },
      {
        type: 'boolean',
        name: 'testable',
        label: t`需要质检`,
        icon: 'test'
      },
      {
        type: 'boolean',
        name: 'trackable',
        label: t`可追踪批次`
      },
      {
        type: 'boolean',
        name: 'purchaseable',
        label: t`可进货`
      },
      {
        type: 'boolean',
        name: 'salable',
        icon: 'saleable',
        label: t`可出货`
      },
      {
        type: 'boolean',
        name: 'virtual',
        label: t`虚拟货品`
      },
      {
        type: 'boolean',
        name: 'starred',
        label: t`已订阅`,
        icon: 'bell'
      }
    ];

    // Bottom right - other part information
    const br: DetailsField[] = [
      {
        type: 'string',
        name: 'creation_date',
        label: t`创建日期`
      },
      {
        type: 'string',
        name: 'creation_user',
        label: t`创建人`,
        badge: 'user',
        icon: 'user',
        hidden: !part.creation_user
      },
      {
        type: 'string',
        name: 'responsible',
        label: t`负责人`,
        badge: 'owner',
        hidden: !part.responsible
      },
      {
        name: 'default_expiry',
        label: t`默认保质期`,
        hidden: !part.default_expiry,
        icon: 'calendar',
        type: 'string',
        value_formatter: () => {
          return `${part.default_expiry} ${t`days`}`;
        }
      }
    ];

    // Add in price range data
    if (part.pricing_min || part.pricing_max) {
      br.push({
        type: 'string',
        name: 'pricing',
        label: t`价格区间`,
        value_formatter: () => {
          return formatPriceRange(part.pricing_min, part.pricing_max);
        }
      });
    }

    br.push({
      type: 'string',
      name: 'latest_serial_number',
      label: t`最新追踪码`,
      hidden: !part.trackable || !data.latest_serial_number,
      icon: 'serial'
    });

    return part ? (
      <ItemDetailsGrid>
        <Stack gap='xs'>
          <Grid grow>
            <DetailsImage
              appRole={UserRoles.part}
              imageActions={{
                selectExisting: true,
                downloadImage: true,
                uploadFile: true,
                deleteFile: true
              }}
              src={part.image}
              thumbnail={part.thumbnail}
              apiPath={apiUrl(ApiEndpoints.part_list, part.pk)}
              refresh={refreshInstance}
              pk={part.pk}
            />
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <DetailsTable fields={tl} item={data} />
            </Grid.Col>
          </Grid>
          <TagsList tags={part.tags} />
          {enableRevisionSelection && (
            <Paper p='sm' withBorder>
              <Stack gap='xs'>
                <Group gap='xs'>
                  <ActionIcon variant='transparent'>
                    <IconVersions />
                  </ActionIcon>
                  <Text>{t`选择货品规格版本`}</Text>
                </Group>
                <RevisionSelector part={part} options={partRevisionOptions} />
              </Stack>
            </Paper>
          )}
        </Stack>
        <DetailsTable fields={tr} item={data} />
        <DetailsTable fields={bl} item={data} />
        <DetailsTable fields={br} item={data} />
      </ItemDetailsGrid>
    ) : (
      <Skeleton />
    );
  }, [
    globalSettings,
    part,
    id,
    serials,
    instanceQuery.isFetching,
    instanceQuery.data,
    enableRevisionSelection,
    partRevisionOptions,
    partRequirementsQuery.isFetching,
    partRequirements
  ]);

  // Part data panels (recalculate when part data changes)
  const partPanels: PanelType[] = useMemo(() => {
    return [
      {
        name: 'details',
        label: t`货品详情`,
        icon: <IconInfoCircle />,
        content: detailsPanel
      },
      {
        name: 'stock',
        label: t`库存`,
        icon: <IconPackages />,
        hidden: part.virtual || !user.hasViewRole(UserRoles.stock),
        content: part.pk ? (
          <StockItemTable
            tableName='part-stock'
            allowAdd
            params={{
              part: part.pk
            }}
          />
        ) : (
          <Center>
            <Loader />
          </Center>
        )
      },
      {
        name: 'variants',
        label: t`规格/变体`,
        icon: <IconVersions />,
        hidden: !part.is_template,
        content: <PartVariantTable part={part} />
      },
      {
        name: 'allocations',
        label: t`库存占用`,
        icon: <IconBookmarks />,
        hidden: (!part.component && !part.salable) || part.virtual,
        content: part.pk ? <PartAllocationPanel part={part} /> : <Skeleton />
      },
      {
        name: 'bom',
        label: t`组合清单`,
        controls: (
          <BomActions bomInformation={bomInformation} partInstance={part} />
        ),
        icon: <IconListTree />,
        hidden: !part.assembly || !user.hasViewRole(UserRoles.bom),
        content: part?.pk ? (
          <Stack gap='xs'>
            {bomInformation.isLoaded &&
              bomInformation.instance?.bom_validated === false && (
                <Alert
                  color='yellow'
                  icon={<IconExclamationCircle />}
                  title={t`组合清单未校验`}
                >
                  <Text>{t`此组合货品的组合清单尚未校验。`}</Text>
                </Alert>
              )}
            <BomTable
              partId={part.pk ?? -1}
              partLocked={part?.locked == true}
            />
          </Stack>
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'used_in',
        label: t`用于哪些组合`,
        icon: <IconStack2 />,
        hidden: !part.component,
        content: <UsedInTable partId={part.pk ?? -1} />
      },
      {
        name: 'pricing',
        label: t`货品价格`,
        icon: <IconCurrencyDollar />,
        content: part ? <PartPricingPanel part={part} /> : <Skeleton />
      },
      {
        name: 'suppliers',
        label: t`供货信息`,
        icon: <IconBuilding />,
        hidden:
          !part.purchaseable || !user.hasViewRole(UserRoles.purchase_order),

        content: part.pk ? (
          <PartSupplierDetail partId={part.pk} />
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'purchase_orders',
        label: t`进货单`,
        icon: <IconShoppingCart />,
        hidden:
          !part.purchaseable || !user.hasViewRole(UserRoles.purchase_order),
        content: part.pk ? (
          <PartPurchaseOrdersTable partId={part.pk} />
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'sales_orders',
        label: t`出货单`,
        icon: <IconTruckDelivery />,
        hidden: !part.salable || !user.hasViewRole(UserRoles.sales_order),
        content: part.pk ? <SalesOrderTable partId={part.pk} /> : <Skeleton />
      },
      {
        name: 'return_orders',
        label: t`退货单`,
        icon: <IconTruckReturn />,
        hidden:
          !part.salable ||
          !user.hasViewRole(UserRoles.return_order) ||
          !globalSettings.isSet('RETURNORDER_ENABLED'),
        content: part.pk ? <ReturnOrderTable partId={part.pk} /> : <Skeleton />
      },
      {
        name: 'builds',
        label: t`组合配货单`,
        icon: <IconTools />,
        hidden: !part.assembly || !user.hasViewRole(UserRoles.build),
        content: part.pk ? <BuildOrderTable partId={part.pk} /> : <Skeleton />
      },
      {
        name: 'transfer_orders',
        label: t`移库单`,
        icon: <IconTransfer />,
        hidden:
          part.virtual ||
          !globalSettings.isSet('TRANSFERORDER_ENABLED') ||
          !user.hasViewRole(UserRoles.transfer_order),
        content: part.pk ? (
          <TransferOrderTable partId={part.pk} />
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'stocktake',
        label: t`库存流水`,
        icon: <IconClipboardList />,
        content: part ? (
          <PartStockHistoryDetail partId={part.pk} />
        ) : (
          <Skeleton />
        ),
        hidden:
          part.virtual ||
          !user.hasViewRole(UserRoles.stock) ||
          !globalSettings.isSet('STOCKTAKE_ENABLE') ||
          !userSettings.isSet('DISPLAY_STOCKTAKE_TAB')
      },
      {
        name: 'test_templates',
        label: t`质检模板`,
        icon: <IconTestPipe />,
        hidden: !part.testable,
        content: part?.pk ? (
          <PartTestTemplateTable
            partId={part?.pk}
            partLocked={
              globalSettings.isSet('PART_ENABLE_LOCKING') && part?.locked
            }
          />
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'test_results',
        label: t`Test Results`,
        icon: <IconChecklist />,
        hidden: !part.testable || !user.hasViewRole(UserRoles.stock),
        content: part?.pk ? (
          <PartTestResultTable partId={part.pk} />
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'related_parts',
        label: t`Related Parts`,
        icon: <IconLayersLinked />,
        content: <RelatedPartTable partId={part.pk} />
      },
      {
        name: 'parameters',
        label: t`Parameters`,
        icon: <IconListDetails />,
        content: (
          <>
            {lockingEnabled && part.locked && (
              <Alert
                title={t`货品已锁定`}
                color='orange'
                icon={<IconLock />}
                p='xs'
              >
                <Text>{t`货品已锁定，不能编辑货品参数`}</Text>
              </Alert>
            )}
            <ParameterTable
              modelType={ModelType.part}
              modelId={part?.pk}
              allowEdit={!lockingEnabled || part?.locked != true}
            />
          </>
        )
      },
      AttachmentPanel({
        model_type: ModelType.part,
        model_id: part?.pk
      }),
      NotesPanel({
        model_type: ModelType.part,
        model_id: part?.pk,
        has_note: !!part?.notes
      })
    ];
  }, [
    id,
    part,
    user,
    globalSettings,
    userSettings,
    detailsPanel,
    bomInformation
  ]);

  const breadcrumbs = useMemo(() => {
    return [
      { name: t`货品`, url: '/part' },
      ...(part.category_path ?? []).map((c: any) => ({
        name: c.name,
        url: getDetailUrl(ModelType.partcategory, c.pk)
      }))
    ];
  }, [part]);

  const badges: ReactNode[] = useMemo(() => {
    if (partRequirementsQuery.isFetching) {
      return [];
    }

    const allocated =
      partRequirements.allocated_to_build_orders +
      partRequirements.allocated_to_sales_orders;

    const required =
      partRequirements.required_for_build_orders +
      partRequirements.required_for_sales_orders;

    const shortfall = Math.max(required - partRequirements.total_stock, 0);

    let stockColor = 'green';

    if (partRequirements.total_stock <= part.minimum_stock) {
      stockColor = 'orange';
    } else if (
      part.maximum_stock > 0 &&
      partRequirements.total_stock > part.maximum_stock
    ) {
      stockColor = 'teal';
    }

    return [
      <DetailsBadge
        label={`${t`In Stock`}: ${formatDecimal(partRequirements.total_stock)}`}
        color={stockColor}
        visible={!part.virtual && partRequirements.total_stock > 0}
        key='in_stock'
      />,
      <DetailsBadge
        label={`${t`Available`}: ${formatDecimal(partRequirements.unallocated_stock)}`}
        color='yellow'
        key='available_stock'
        visible={
          !part.virtual &&
          partRequirements.unallocated_stock != partRequirements.total_stock
        }
      />,
      <DetailsBadge
        label={t`No Stock`}
        color='orange'
        visible={!part.virtual && partRequirements.total_stock == 0}
        key='no_stock'
      />,
      <DetailsBadge
        label={`${t`Allocated`}: ${formatDecimal(allocated)}`}
        color='blue'
        visible={allocated > 0}
        key='allocated'
      />,
      <DetailsBadge
        label={`${t`Required`}: ${formatDecimal(required)}`}
        color='grape'
        visible={required > 0}
        key='required'
      />,
      <DetailsBadge
        label={`${t`On Order`}: ${formatDecimal(partRequirements.ordering)}`}
        color='blue'
        visible={partRequirements.ordering > 0}
        key='on_order'
      />,
      <DetailsBadge
        label={`${t`In Production`}: ${formatDecimal(partRequirements.scheduled_to_build)}`}
        color='blue'
        visible={partRequirements.scheduled_to_build > 0}
        key='in_production'
      />,
      <DetailsBadge
        label={`${t`Deficit`}: ${formatDecimal(shortfall)}`}
        color='red'
        visible={shortfall > 0}
        key='deficit'
      />,
      <DetailsBadge
        label={t`Inactive`}
        color='red'
        visible={!part.active}
        key='inactive'
      />,
      <DetailsBadge
        label={t`虚拟货品`}
        color='cyan.4'
        visible={part.virtual}
        key='virtual'
      />
    ];
  }, [partRequirements, partRequirementsQuery.isFetching, part]);

  const partFields = usePartFields({
    create: false,
    partId: part.pk
  });

  const editPart = useEditApiFormModal({
    url: ApiEndpoints.part_list,
    pk: part.pk,
    title: t`编辑货品`,
    fields: partFields,
    queryParams: new URLSearchParams({ tags: 'true' }),
    onFormSuccess: refreshInstance
  });

  const duplicatePartFields = usePartFields({
    create: true,
    duplicatePartInstance: part
  });

  const duplicatePart = useCreateApiFormModal({
    url: ApiEndpoints.part_list,
    title: t`新增货品`,
    fields: duplicatePartFields,
    initialData: {
      ...part,
      active: true,
      locked: false
    },
    follow: true,
    modelType: ModelType.part
  });

  const deletePart = useDeleteApiFormModal({
    url: ApiEndpoints.part_list,
    pk: part.pk,
    title: t`删除货品`,
    onFormSuccess: () => {
      if (part.category) {
        navigate(getDetailUrl(ModelType.partcategory, part.category));
      } else {
        navigate('/part/');
      }
    },
    preFormContent: (
      <Alert color='red' title={t`删除此货品后无法撤销`}>
        <Stack gap='xs'>
          <Thumbnail src={part.thumbnail ?? part.image} text={part.full_name} />
        </Stack>
      </Alert>
    )
  });

  const stockOperationProps: StockOperationProps = useMemo(() => {
    return {
      pk: part.pk,
      model: ModelType.part,
      refresh: refreshInstance,
      filters: {
        in_stock: true
      }
    };
  }, [part]);

  const stockAdjustActions = useStockAdjustActions({
    formProps: stockOperationProps,
    merge: false,
    changeBatch: false,
    enabled: true
  });

  const orderPartsWizard = OrderPartsWizard({
    parts: [part]
  });

  const findBySerialNumber = useFindSerialNumberForm({ partId: part.pk });

  const partActions = useMemo(() => {
    return [
      <AdminButton model={ModelType.part} id={part.pk} />,
      <StarredToggleButton
        key='starred_change'
        instance={part}
        model={ModelType.part}
        successFunction={() => {
          refreshInstance();
        }}
      />,
      <BarcodeActionDropdown
        model={ModelType.part}
        pk={part.pk}
        hash={part?.barcode_hash}
        perm={user.hasChangeRole(UserRoles.part)}
        key='action_dropdown'
      />,
      <PrintingActions
        modelType={ModelType.part}
        items={[part.pk]}
        enableReports
        enableLabels
      />,
      <ActionDropdown
        tooltip={t`库存操作`}
        icon={<IconPackages />}
        hidden={part.virtual || !user.hasViewRole(UserRoles.stock)}
        actions={[
          ...stockAdjustActions.menuActions,
          {
            name: t`进货`,
            tooltip: t`为此货品创建进货流程`,
            hidden:
              !user.hasAddRole(UserRoles.purchase_order) ||
              !part?.active ||
              !part?.purchaseable,
            icon: <IconShoppingCart color='blue' />,
            onClick: () => {
              orderPartsWizard.openWizard();
            }
          },
          {
            name: t`查追踪码`,
            tooltip: t`按追踪码查询`,
            hidden: !part.trackable,
            icon: <IconSearch />,
            onClick: findBySerialNumber.open
          }
        ]}
      />,
      <OptionsActionDropdown
        tooltip={t`货品操作`}
        actions={[
          DuplicateItemAction({
            hidden: !user.hasAddRole(UserRoles.part),
            onClick: () => duplicatePart.open()
          }),
          EditItemAction({
            hidden: !user.hasChangeRole(UserRoles.part),
            onClick: () => editPart.open()
          }),
          DeleteItemAction({
            hidden: !user.hasDeleteRole(UserRoles.part),
            disabled: part.active,
            onClick: () => deletePart.open()
          })
        ]}
      />
    ];
  }, [id, part, user, stockAdjustActions.menuActions]);

  return (
    <>
      {editPart.modal}
      {deletePart.modal}
      {duplicatePart.modal}
      {orderPartsWizard.wizard}
      {findBySerialNumber.modal}
      {stockAdjustActions.modals.map((modal) => modal.modal)}
      <InstanceDetail query={instanceQuery} requiredRole={UserRoles.part}>
        <Stack gap='xs'>
          {user.hasViewRole(UserRoles.part_category) && (
            <NavigationTree
              title={t`货品分类`}
              childIdentifier='subcategories'
              modelType={ModelType.partcategory}
              endpoint={ApiEndpoints.category_tree}
              opened={treeOpen}
              onClose={() => {
                setTreeOpen(false);
              }}
              selectedId={part?.category}
            />
          )}
          <PageDetail
            title={`${t`货品`}: ${part.full_name}`}
            icon={
              lockingEnabled ? (
                <ActionIcon
                  aria-label='part-lock-icon'
                  variant='transparent'
                  disabled={!user.hasChangeRole(UserRoles.part)}
                  onClick={() => {
                    const locking = !part.locked;
                    api
                      .patch(apiUrl(ApiEndpoints.part_list, part.pk), {
                        locked: locking
                      })
                      .then(() => {
                        notifications.hide('part-lock');
                        notifications.show({
                          id: 'part-lock',
                          message: locking ? t`货品已锁定` : t`货品已解锁`,
                          color: 'green',
                          icon: locking ? (
                            <IconLock size='1rem' />
                          ) : (
                            <IconLockOpen size='1rem' />
                          )
                        });
                        refreshInstance();
                      });
                  }}
                >
                  {part?.locked ? <IconLock /> : <IconLockOpen />}
                </ActionIcon>
              ) : undefined
            }
            subtitle={part.description}
            imageUrl={part.image}
            thumbnailUrl={part.thumbnail}
            badges={badges}
            breadcrumbs={
              user.hasViewRole(UserRoles.part_category)
                ? breadcrumbs
                : undefined
            }
            lastCrumb={[
              {
                name: part.name,
                url: `/part/${part.pk}/`
              }
            ]}
            breadcrumbAction={() => {
              setTreeOpen(true);
            }}
            editAction={editPart.open}
            editEnabled={user.hasChangeRole(UserRoles.part)}
            actions={partActions}
          />
          <PanelGroup
            pageKey='part'
            panels={partPanels}
            instance={part}
            reloadInstance={refreshInstance}
            model={ModelType.part}
            id={part.pk}
          />
        </Stack>
      </InstanceDetail>
    </>
  );
}
