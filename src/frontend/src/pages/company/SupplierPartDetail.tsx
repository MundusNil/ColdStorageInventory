import { t } from '@lingui/core/macro';
import { Grid, Skeleton, Stack } from '@mantine/core';
import {
  IconCurrencyDollar,
  IconInfoCircle,
  IconPackages,
  IconShoppingCart
} from '@tabler/icons-react';
import { type ReactNode, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import TagsList from '@lib/components/TagsList';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import { formatDecimal } from '@lib/functions/Formatting';
import { getDetailUrl } from '@lib/functions/Navigation';
import type { PanelType } from '@lib/types/Panel';
import AdminButton from '../../components/buttons/AdminButton';
import {
  type DetailsField,
  DetailsTable
} from '../../components/details/Details';
import DetailsBadge from '../../components/details/DetailsBadge';
import { DetailsImage } from '../../components/details/DetailsImage';
import { ItemDetailsGrid } from '../../components/details/ItemDetails';
import {
  BarcodeActionDropdown,
  DeleteItemAction,
  DuplicateItemAction,
  EditItemAction,
  OptionsActionDropdown
} from '../../components/items/ActionDropdown';
import InstanceDetail from '../../components/nav/InstanceDetail';
import { PageDetail } from '../../components/nav/PageDetail';
import AttachmentPanel from '../../components/panels/AttachmentPanel';
import NotesPanel from '../../components/panels/NotesPanel';
import { PanelGroup } from '../../components/panels/PanelGroup';
import ParametersPanel from '../../components/panels/ParametersPanel';
import { useSupplierPartFields } from '../../forms/CompanyForms';
import {
  useCreateApiFormModal,
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useInstance } from '../../hooks/UseInstance';
import { useUserState } from '../../states/UserState';
import { PurchaseOrderTable } from '../../tables/purchasing/PurchaseOrderTable';
import SupplierPriceBreakTable from '../../tables/purchasing/SupplierPriceBreakTable';
import { StockItemTable } from '../../tables/stock/StockItemTable';

export default function SupplierPartDetail() {
  const { id } = useParams();

  const user = useUserState();

  const navigate = useNavigate();

  const {
    instance: supplierPart,
    instanceQuery,
    refreshInstance
  } = useInstance({
    endpoint: ApiEndpoints.supplier_part_list,
    pk: id,
    hasPrimaryKey: true,
    params: {
      part_detail: true,
      supplier_detail: true,
      manufacturer_detail: true,
      tags: true
    }
  });

  const detailsPanel = useMemo(() => {
    if (instanceQuery.isFetching) {
      return <Skeleton />;
    }

    const data = supplierPart ?? {};

    // Access nested data
    data.manufacturer =
      supplierPart.manufacturer || data.manufacturer_detail?.pk;
    data.MPN = supplierPart.MPN || data.manufacturer_part_detail?.MPN;
    data.manufacturer_part =
      supplierPart.manufacturer_part || data.manufacturer_part_detail?.pk;

    const tl: DetailsField[] = [
      {
        type: 'link',
        name: 'part',
        label: t`货品`,
        model: ModelType.part,
        hidden: !supplierPart.part
      },
      {
        type: 'string',
        name: 'part_detail.IPN',
        label: t`货品编码`,
        copy: true,
        hidden: !data.part_detail?.IPN,
        icon: 'serial'
      },
      {
        type: 'string',
        name: 'part_detail.description',
        label: t`货品说明`,
        copy: true,
        icon: 'info',
        hidden: !data.part_detail?.description
      },
      {
        type: 'link',
        external: true,
        name: 'link',
        label: t`外部链接`,
        copy: true,
        hidden: !supplierPart.link
      },
      {
        type: 'string',
        name: 'note',
        label: t`备注`,
        copy: true,
        hidden: !supplierPart.note
      }
    ];

    const bl: DetailsField[] = [
      {
        type: 'link',
        name: 'supplier',
        label: t`供货商`,
        model: ModelType.company,
        icon: 'suppliers',
        hidden: !supplierPart.supplier
      },
      {
        type: 'string',
        name: 'SKU',
        label: t`供货商货号`,
        copy: true,
        icon: 'reference'
      },
      {
        type: 'string',
        name: 'description',
        label: t`说明`,
        copy: true,
        hidden: !data.description
      },
      {
        type: 'link',
        name: 'manufacturer',
        label: t`生产厂家/品牌`,
        model: ModelType.company,
        icon: 'manufacturers',
        hidden: !data.manufacturer
      },
      {
        type: 'link',
        name: 'manufacturer_part',
        model_field: 'MPN',
        label: t`生产厂家货号`,
        model: ModelType.manufacturerpart,
        icon: 'reference',
        hidden: !data.manufacturer_part
      }
    ];

    const br: DetailsField[] = [
      {
        type: 'string',
        name: 'packaging',
        label: t`包装`,
        copy: true,
        hidden: !data.packaging
      },
      {
        type: 'string',
        name: 'pack_quantity',
        label: t`包装数量`,
        copy: true,
        hidden: !data.pack_quantity,
        icon: 'packages'
      }
    ];

    const tr: DetailsField[] = [
      {
        type: 'number',
        name: 'in_stock',
        label: t`库存数量`,
        copy: true,
        icon: 'stock'
      },
      {
        type: 'number',
        name: 'on_order',
        label: t`进货在途`,
        copy: true,
        icon: 'purchase_orders'
      },
      {
        type: 'number',
        name: 'available',
        label: t`供货商可供数量`,
        hidden: !data.availability_updated,
        copy: true,
        icon: 'packages'
      },
      {
        type: 'date',
        name: 'availability_updated',
        label: t`可供数量更新时间`,
        copy: true,
        hidden: !data.availability_updated,
        icon: 'calendar'
      }
    ];

    return (
      <ItemDetailsGrid>
        <Stack gap='xs'>
          <Grid grow>
            <DetailsImage
              appRole={UserRoles.part}
              src={supplierPart?.part_detail?.image}
              apiPath={apiUrl(
                ApiEndpoints.part_list,
                supplierPart?.part_detail?.pk
              )}
              pk={supplierPart?.part_detail?.pk}
            />
            <Grid.Col span={8}>
              <DetailsTable title={t`货品详情`} fields={tl} item={data} />
            </Grid.Col>
          </Grid>
          <TagsList tags={supplierPart.tags} />
        </Stack>
        <DetailsTable title={t`供货商`} fields={bl} item={data} />
        <DetailsTable title={t`包装`} fields={br} item={data} />
        <DetailsTable title={t`供货情况`} fields={tr} item={data} />
      </ItemDetailsGrid>
    );
  }, [supplierPart, instanceQuery.isFetching]);

  const panels: PanelType[] = useMemo(() => {
    return [
      {
        name: 'details',
        label: t`供货商货品详情`,
        icon: <IconInfoCircle />,
        content: detailsPanel
      },
      {
        name: 'stock',
        label: t`已入库库存`,
        icon: <IconPackages />,
        content: supplierPart?.pk ? (
          <StockItemTable
            tableName='supplier-stock'
            allowAdd={false}
            params={{ supplier_part: supplierPart.pk }}
          />
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'purchaseorders',
        label: t`进货单`,
        icon: <IconShoppingCart />,
        content: supplierPart?.pk ? (
          <PurchaseOrderTable
            supplierId={supplierPart.supplier}
            supplierPartId={supplierPart.pk}
          />
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'pricing',
        label: t`供货商报价`,
        icon: <IconCurrencyDollar />,
        content: supplierPart?.pk ? (
          <SupplierPriceBreakTable supplierPart={supplierPart} />
        ) : (
          <Skeleton />
        )
      },
      ParametersPanel({
        model_type: ModelType.supplierpart,
        model_id: supplierPart?.pk
      }),
      AttachmentPanel({
        model_type: ModelType.supplierpart,
        model_id: supplierPart?.pk
      }),
      NotesPanel({
        model_type: ModelType.supplierpart,
        model_id: supplierPart?.pk,
        has_note: !!supplierPart?.notes
      })
    ];
  }, [supplierPart]);

  const supplierPartActions = useMemo(() => {
    return [
      <AdminButton model={ModelType.supplierpart} id={supplierPart.pk} />,
      <BarcodeActionDropdown
        model={ModelType.supplierpart}
        pk={supplierPart.pk}
        hash={supplierPart.barcode_hash}
        perm={user.hasChangeRole(UserRoles.purchase_order)}
      />,
      <OptionsActionDropdown
        tooltip={t`供货商货品操作`}
        actions={[
          DuplicateItemAction({
            hidden: !user.hasAddRole(UserRoles.purchase_order),
            onClick: () => duplicateSupplierPart.open()
          }),
          EditItemAction({
            hidden: !user.hasChangeRole(UserRoles.purchase_order),
            onClick: () => editSupplierPart.open()
          }),
          DeleteItemAction({
            hidden: !user.hasDeleteRole(UserRoles.purchase_order),
            onClick: () => deleteSupplierPart.open()
          })
        ]}
      />
    ];
  }, [user, supplierPart]);

  const supplierPartFields = useSupplierPartFields({});

  const editSupplierPart = useEditApiFormModal({
    url: ApiEndpoints.supplier_part_list,
    pk: supplierPart?.pk,
    title: t`编辑供货商货品`,
    fields: supplierPartFields,
    queryParams: new URLSearchParams({ tags: 'true' }),
    onFormSuccess: refreshInstance
  });

  const deleteSupplierPart = useDeleteApiFormModal({
    url: ApiEndpoints.supplier_part_list,
    pk: supplierPart?.pk,
    title: t`删除供货商货品`,
    onFormSuccess: () => {
      navigate(getDetailUrl(ModelType.part, supplierPart.part));
    }
  });

  const duplicateSupplierPart = useCreateApiFormModal({
    url: ApiEndpoints.supplier_part_list,
    title: t`新增供货商货品`,
    fields: supplierPartFields,
    initialData: {
      ...supplierPart
    },
    follow: true,
    modelType: ModelType.supplierpart
  });

  const breadcrumbs = useMemo(() => {
    return [
      {
        name: t`进货管理`,
        url: '/purchasing/'
      },
      {
        name: supplierPart?.supplier_detail?.name ?? t`供货商`,
        url: `/purchasing/supplier/${supplierPart?.supplier_detail?.pk ?? ''}`
      }
    ];
  }, [supplierPart]);

  const badges: ReactNode[] = useMemo(() => {
    return [
      <DetailsBadge
        label={t`已停用`}
        color='red'
        visible={supplierPart.active == false}
      />,
      <DetailsBadge
        label={`${t`库存数量`}: ${formatDecimal(supplierPart.in_stock)}`}
        color={'green'}
        visible={
          supplierPart?.active &&
          supplierPart?.in_stock &&
          supplierPart?.in_stock > 0
        }
        key='in_stock'
      />,
      <DetailsBadge
        label={t`无库存`}
        color={'red'}
        visible={supplierPart.active && supplierPart.in_stock == 0}
        key='no_stock'
      />,
      <DetailsBadge
        label={`${t`进货在途`}: ${formatDecimal(supplierPart.on_order)}`}
        color='blue'
        visible={supplierPart.on_order > 0}
        key='on_order'
      />
    ];
  }, [supplierPart]);

  return (
    <>
      {deleteSupplierPart.modal}
      {duplicateSupplierPart.modal}
      {editSupplierPart.modal}
      <InstanceDetail
        query={instanceQuery}
        requiredRole={UserRoles.purchase_order}
      >
        <Stack gap='xs'>
          <PageDetail
            title={t`供货商货品`}
            subtitle={`${supplierPart.SKU} - ${supplierPart?.part_detail?.name}`}
            breadcrumbs={breadcrumbs}
            lastCrumb={[
              {
                name: supplierPart.SKU,
                url: `/purchasing/supplier-part/${supplierPart.pk}/`
              }
            ]}
            badges={badges}
            actions={supplierPartActions}
            imageUrl={supplierPart?.part_detail?.thumbnail}
            editAction={editSupplierPart.open}
            editEnabled={user.hasChangePermission(ModelType.supplierpart)}
          />
          <PanelGroup
            pageKey='supplierpart'
            panels={panels}
            instance={supplierPart}
            reloadInstance={refreshInstance}
            model={ModelType.supplierpart}
            id={supplierPart.pk}
          />
        </Stack>
      </InstanceDetail>
    </>
  );
}
