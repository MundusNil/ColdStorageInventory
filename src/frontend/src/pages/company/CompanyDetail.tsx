import { t } from '@lingui/core/macro';
import { Grid, Skeleton, Stack } from '@mantine/core';
import {
  IconBuildingWarehouse,
  IconInfoCircle,
  IconMap2,
  IconPackageExport,
  IconPackages,
  IconShoppingCart,
  IconTruckDelivery,
  IconTruckReturn,
  IconUsersGroup
} from '@tabler/icons-react';
import { type ReactNode, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import { TagsList } from '@lib/index';
import type { PanelType } from '@lib/types/Panel';
import AdminButton from '../../components/buttons/AdminButton';
import { PrintingActions } from '../../components/buttons/PrintingActions';
import {
  type DetailsField,
  DetailsTable
} from '../../components/details/Details';
import DetailsBadge from '../../components/details/DetailsBadge';
import { DetailsImage } from '../../components/details/DetailsImage';
import { ItemDetailsGrid } from '../../components/details/ItemDetails';
import {
  DeleteItemAction,
  DuplicateItemAction,
  EditItemAction,
  OptionsActionDropdown
} from '../../components/items/ActionDropdown';
import type { Breadcrumb } from '../../components/nav/BreadcrumbList';
import InstanceDetail from '../../components/nav/InstanceDetail';
import { PageDetail } from '../../components/nav/PageDetail';
import AttachmentPanel from '../../components/panels/AttachmentPanel';
import NotesPanel from '../../components/panels/NotesPanel';
import { PanelGroup } from '../../components/panels/PanelGroup';
import ParametersPanel from '../../components/panels/ParametersPanel';
import { companyFields } from '../../forms/CompanyForms';
import {
  useCreateApiFormModal,
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useInstance } from '../../hooks/UseInstance';
import { useUserState } from '../../states/UserState';
import { AddressTable } from '../../tables/company/AddressTable';
import { ContactTable } from '../../tables/company/ContactTable';
import { ManufacturerPartTable } from '../../tables/purchasing/ManufacturerPartTable';
import { PurchaseOrderTable } from '../../tables/purchasing/PurchaseOrderTable';
import { SupplierPartTable } from '../../tables/purchasing/SupplierPartTable';
import { ReturnOrderTable } from '../../tables/sales/ReturnOrderTable';
import { SalesOrderTable } from '../../tables/sales/SalesOrderTable';
import { StockItemTable } from '../../tables/stock/StockItemTable';

export type CompanyDetailProps = {
  title: string;
  breadcrumbs: Breadcrumb[];
  last_crumb_url: string;
};

/**
 * Detail view for a single company instance
 */
export default function CompanyDetail(props: Readonly<CompanyDetailProps>) {
  const { id } = useParams();

  const navigate = useNavigate();
  const user = useUserState();

  const {
    instance: company,
    refreshInstance,
    instanceQuery
  } = useInstance({
    endpoint: ApiEndpoints.company_list,
    pk: id,
    params: {
      tags: true
    },
    refetchOnMount: true
  });

  const detailsPanel = useMemo(() => {
    if (instanceQuery.isFetching) {
      return <Skeleton />;
    }

    const tl: DetailsField[] = [
      {
        type: 'text',
        name: 'description',
        label: t`说明`,
        copy: true
      },
      {
        type: 'link',
        name: 'website',
        label: t`网站`,
        external: true,
        copy: true,
        hidden: !company.website
      },
      {
        type: 'text',
        name: 'phone',
        label: t`电话`,
        copy: true,
        hidden: !company.phone
      },
      {
        type: 'text',
        name: 'email',
        label: t`邮箱`,
        copy: true,
        hidden: !company.email
      },
      {
        type: 'text',
        name: 'tax_id',
        label: t`税号`,
        copy: true,
        hidden: !company.tax_id
      }
    ];

    const tr: DetailsField[] = [
      {
        type: 'string',
        name: 'currency',
        label: t`默认币种`
      },
      {
        type: 'boolean',
        name: 'is_supplier',
        label: t`供货商`,
        icon: 'suppliers'
      },
      {
        type: 'boolean',
        name: 'is_manufacturer',
        label: t`生产厂家/品牌`,
        icon: 'manufacturers'
      },
      {
        type: 'boolean',
        name: 'is_customer',
        label: t`客户`,
        icon: 'customers'
      }
    ];

    return (
      <ItemDetailsGrid>
        <Stack gap='xs'>
          <Grid grow>
            <DetailsImage
              appRole={UserRoles.purchase_order}
              apiPath={apiUrl(ApiEndpoints.company_list, company.pk)}
              src={company.image}
              pk={company.pk}
              refresh={refreshInstance}
              imageActions={{
                uploadFile: true,
                downloadImage: true,
                deleteFile: true
              }}
            />
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <DetailsTable item={company} fields={tl} />
            </Grid.Col>
          </Grid>
          <TagsList tags={company.tags} />
        </Stack>
        <DetailsTable item={company} fields={tr} />
      </ItemDetailsGrid>
    );
  }, [company, instanceQuery]);

  const companyPanels: PanelType[] = useMemo(() => {
    return [
      {
        name: 'details',
        label: t`单位详情`,
        icon: <IconInfoCircle />,
        content: detailsPanel
      },
      {
        name: 'supplied-parts',
        label: t`供货商货品`,
        icon: <IconPackageExport />,
        hidden: !company?.is_supplier,
        content: company?.pk && <SupplierPartTable supplierId={company.pk} />
      },
      {
        name: 'manufactured-parts',
        label: t`生产厂家货号`,
        icon: <IconBuildingWarehouse />,
        hidden: !company?.is_manufacturer,
        content: company?.pk && (
          <ManufacturerPartTable manufacturerId={company.pk} />
        )
      },
      {
        name: 'purchase-orders',
        label: t`进货单`,
        icon: <IconShoppingCart />,
        hidden: !company?.is_supplier,
        content: company?.pk && <PurchaseOrderTable supplierId={company.pk} />
      },
      {
        name: 'stock-items',
        label: t`库存批次`,
        icon: <IconPackages />,
        hidden: !company?.is_manufacturer && !company?.is_supplier,
        content: company?.pk && (
          <StockItemTable
            allowAdd={false}
            tableName='company-stock'
            params={{ company: company.pk }}
          />
        )
      },
      {
        name: 'sales-orders',
        label: t`出货单`,
        icon: <IconTruckDelivery />,
        hidden: !company?.is_customer,
        content: company?.pk && <SalesOrderTable customerId={company.pk} />
      },
      {
        name: 'return-orders',
        label: t`退货单`,
        icon: <IconTruckReturn />,
        hidden: !company?.is_customer,
        content: company.pk ? (
          <ReturnOrderTable customerId={company.pk} />
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'assigned-stock',
        label: t`客户占用库存`,
        icon: <IconPackageExport />,
        hidden: !company?.is_customer,
        content: company?.pk ? (
          <StockItemTable
            allowAdd={false}
            tableName='assigned-stock'
            showLocation={false}
            allowReturn
            defaultInStock={null}
            params={{ customer: company.pk }}
          />
        ) : (
          <Skeleton />
        )
      },
      {
        name: 'contacts',
        label: t`联系人`,
        icon: <IconUsersGroup />,
        content: company?.pk && <ContactTable companyId={company.pk} />
      },
      {
        name: 'addresses',
        label: t`地址`,
        icon: <IconMap2 />,
        content: company?.pk && <AddressTable companyId={company.pk} />
      },
      ParametersPanel({
        model_type: ModelType.company,
        model_id: company?.pk
      }),
      AttachmentPanel({
        model_type: ModelType.company,
        model_id: company.pk
      }),
      NotesPanel({
        model_type: ModelType.company,
        model_id: company.pk,
        has_note: !!company.notes
      })
    ];
  }, [id, company, user]);

  const editCompany = useEditApiFormModal({
    url: ApiEndpoints.company_list,
    pk: company?.pk,
    title: t`编辑往来单位`,
    fields: useMemo(() => companyFields({}), []),
    queryParams: new URLSearchParams({ tags: 'true' }),
    onFormSuccess: refreshInstance
  });

  const duplicateCompany = useCreateApiFormModal({
    url: ApiEndpoints.company_list,
    title: t`Duplicate Company`,
    initialData: useMemo(() => ({ ...company }), [company]),
    fields: useMemo(
      () => companyFields({ duplicateCompanyId: company?.pk }),
      [company]
    ),
    follow: true,
    modelType: ModelType.company
  });

  const deleteCompany = useDeleteApiFormModal({
    url: ApiEndpoints.company_list,
    pk: company?.pk,
    title: t`删除往来单位`,
    onFormSuccess: () => {
      navigate('/');
    }
  });

  const companyActions = useMemo(() => {
    return [
      <AdminButton model={ModelType.company} id={company.pk} />,
      <PrintingActions
        modelType={ModelType.company}
        items={[company.pk]}
        enableReports
      />,
      <OptionsActionDropdown
        tooltip={t`往来单位操作`}
        actions={[
          EditItemAction({
            hidden: !user.hasChangeRole(UserRoles.purchase_order),
            onClick: () => editCompany.open()
          }),
          DuplicateItemAction({
            hidden: !user.hasAddRole(UserRoles.purchase_order),
            onClick: () => duplicateCompany.open()
          }),
          DeleteItemAction({
            hidden: !user.hasDeleteRole(UserRoles.purchase_order),
            onClick: () => deleteCompany.open()
          })
        ]}
      />
    ];
  }, [id, company, user]);

  const badges: ReactNode[] = useMemo(() => {
    return [
      <DetailsBadge
        label={t`已停用`}
        color='red'
        visible={company.active == false}
      />
    ];
  }, [company]);

  return (
    <>
      {editCompany.modal}
      {deleteCompany.modal}
      {duplicateCompany.modal}
      <InstanceDetail
        query={instanceQuery}
        requiredPermission={ModelType.company}
      >
        <Stack gap='xs'>
          <PageDetail
            title={`${t`往来单位`}: ${company.name}`}
            subtitle={company.description}
            actions={companyActions}
            imageUrl={company.image}
            breadcrumbs={props.breadcrumbs}
            lastCrumb={[
              {
                name: company.name,
                url: `${props.last_crumb_url}/${company.pk}/`
              }
            ]}
            badges={badges}
            editAction={editCompany.open}
            editEnabled={user.hasChangePermission(ModelType.company)}
          />
          <PanelGroup
            pageKey='company'
            panels={companyPanels}
            instance={company}
            reloadInstance={refreshInstance}
            model={ModelType.company}
            id={company.pk}
          />
        </Stack>
      </InstanceDetail>
    </>
  );
}
