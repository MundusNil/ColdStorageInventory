import { t } from '@lingui/core/macro';
import { Skeleton, Stack } from '@mantine/core';
import {
  IconBuildingWarehouse,
  IconInfoCircle,
  IconPackages
} from '@tabler/icons-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { getDetailUrl } from '@lib/functions/Navigation';
import type { PanelType } from '@lib/types/Panel';
import AdminButton from '../../components/buttons/AdminButton';
import {
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
import { useManufacturerPartFields } from '../../forms/CompanyForms';
import {
  useCreateApiFormModal,
  useDeleteApiFormModal,
  useEditApiFormModal
} from '../../hooks/UseForm';
import { useInstance } from '../../hooks/UseInstance';
import { useInstanceInfo } from '../../hooks/UseInstanceInfo';
import { useUserState } from '../../states/UserState';
import { SupplierPartTable } from '../../tables/purchasing/SupplierPartTable';
import { StockItemTable } from '../../tables/stock/StockItemTable';
import { ManufacturerPartDetailsPanel } from './ManufacturerPartDetailsPanel';

export default function ManufacturerPartDetail() {
  const { id } = useParams();
  const user = useUserState();
  const navigate = useNavigate();

  const {
    instance: manufacturerPart,
    instanceQuery,
    refreshInstance
  } = useInstance({
    endpoint: ApiEndpoints.manufacturer_part_list,
    pk: id,
    hasPrimaryKey: true,
    params: {
      part_detail: true,
      manufacturer_detail: true,
      tags: true
    }
  });

  const { instanceInfo } = useInstanceInfo({
    modelType: ModelType.manufacturerpart,
    modelId: manufacturerPart?.pk
  });

  const panels: PanelType[] = useMemo(() => {
    return [
      {
        name: 'details',
        label: t`生产厂家货号详情`,
        icon: <IconInfoCircle />,
        content: (
          <ManufacturerPartDetailsPanel
            instance={manufacturerPart}
            allowImageEdit
            refreshInstance={refreshInstance}
          />
        )
      },
      {
        name: 'stock',
        label: t`已入库库存`,
        hidden: !user.hasViewRole(UserRoles.stock),
        icon: <IconPackages />,
        content: (
          <StockItemTable
            tableName='manufacturer-part-stock'
            params={{
              manufacturer_part: id
            }}
          />
        )
      },
      {
        name: 'suppliers',
        label: t`供货商`,
        icon: <IconBuildingWarehouse />,
        content: manufacturerPart?.pk ? (
          <SupplierPartTable
            partId={manufacturerPart.part}
            manufacturerId={manufacturerPart.manufacturer}
            manufacturerPartId={manufacturerPart.pk}
          />
        ) : (
          <Skeleton />
        )
      },
      ParametersPanel({
        model_type: ModelType.manufacturerpart,
        model_id: manufacturerPart?.pk,
        parameter_count: instanceInfo.parameter_count
      }),
      AttachmentPanel({
        model_type: ModelType.manufacturerpart,
        model_id: manufacturerPart?.pk,
        attachment_count: instanceInfo.attachment_count
      }),
      NotesPanel({
        model_type: ModelType.manufacturerpart,
        model_id: manufacturerPart?.pk,
        note_count: instanceInfo.note_count
      })
    ];
  }, [user, manufacturerPart, instanceInfo]);

  const editManufacturerPartFields = useManufacturerPartFields();

  const editManufacturerPart = useEditApiFormModal({
    url: ApiEndpoints.manufacturer_part_list,
    pk: manufacturerPart?.pk,
    title: t`编辑生产厂家货号`,
    fields: editManufacturerPartFields,
    queryParams: new URLSearchParams({ tags: 'true' }),
    onFormSuccess: refreshInstance
  });

  const duplicateManufacturerPartFields = useManufacturerPartFields({
    duplicateManufacturerPartId: manufacturerPart?.pk
  });

  const duplicateManufacturerPart = useCreateApiFormModal({
    url: ApiEndpoints.manufacturer_part_list,
    title: t`新增生产厂家货号`,
    fields: duplicateManufacturerPartFields,
    initialData: {
      ...manufacturerPart
    },
    follow: true,
    modelType: ModelType.manufacturerpart
  });

  const deleteManufacturerPart = useDeleteApiFormModal({
    url: ApiEndpoints.manufacturer_part_list,
    pk: manufacturerPart?.pk,
    title: t`删除生产厂家货号`,
    onFormSuccess: () => {
      navigate(getDetailUrl(ModelType.part, manufacturerPart.part));
    }
  });

  const manufacturerPartActions = useMemo(() => {
    return [
      <AdminButton
        key='admin'
        model={ModelType.manufacturerpart}
        id={manufacturerPart.pk}
      />,
      <OptionsActionDropdown
        key='options'
        tooltip={t`生产厂家货号操作`}
        actions={[
          DuplicateItemAction({
            hidden: !user.hasAddRole(UserRoles.purchase_order),
            onClick: () => duplicateManufacturerPart.open()
          }),
          EditItemAction({
            hidden: !user.hasChangeRole(UserRoles.purchase_order),
            onClick: () => editManufacturerPart.open()
          }),
          DeleteItemAction({
            hidden: !user.hasDeleteRole(UserRoles.purchase_order),
            onClick: () => deleteManufacturerPart.open()
          })
        ]}
      />
    ];
  }, [user, manufacturerPart]);

  const breadcrumbs = useMemo(() => {
    return [
      {
        name: t`进货管理`,
        url: '/purchasing/'
      },
      {
        name: manufacturerPart?.manufacturer_detail?.name ?? t`生产厂家/品牌`,
        url: `/purchasing/manufacturer/${manufacturerPart?.manufacturer_detail?.pk}/`
      }
    ];
  }, [manufacturerPart]);

  return (
    <>
      {deleteManufacturerPart.modal}
      {duplicateManufacturerPart.modal}
      {editManufacturerPart.modal}
      <InstanceDetail
        query={instanceQuery}
        requiredPermission={ModelType.manufacturerpart}
      >
        <Stack gap='xs'>
          <PageDetail
            title={t`生产厂家货号`}
            subtitle={`${manufacturerPart.MPN} - ${manufacturerPart.part_detail?.name}`}
            breadcrumbs={breadcrumbs}
            lastCrumb={[
              {
                name: manufacturerPart.MPN,
                url: getDetailUrl(
                  ModelType.manufacturerpart,
                  manufacturerPart.pk
                )
              }
            ]}
            actions={manufacturerPartActions}
            imageUrl={manufacturerPart?.part_detail?.thumbnail}
            editAction={editManufacturerPart.open}
            editEnabled={user.hasChangePermission(ModelType.manufacturerpart)}
          />
          <PanelGroup
            pageKey='manufacturerpart'
            panels={panels}
            instance={manufacturerPart}
            reloadInstance={refreshInstance}
            model={ModelType.manufacturerpart}
            id={manufacturerPart.pk}
          />
        </Stack>
      </InstanceDetail>
    </>
  );
}
