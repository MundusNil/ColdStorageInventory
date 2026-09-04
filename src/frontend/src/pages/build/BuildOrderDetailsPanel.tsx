import { t } from '@lingui/core/macro';
import { Grid, Skeleton, Stack } from '@mantine/core';
import { useMemo } from 'react';

import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';
import { TagsList } from '@lib/index';

import {
  type DetailsField,
  DetailsTable
} from '../../components/details/Details';
import { DetailsImage } from '../../components/details/DetailsImage';
import { ItemDetailsGrid } from '../../components/details/ItemDetails';
import { useParameterDetailsGrid } from '../../components/details/ParameterDetailsGrid';
import { useInstance } from '../../hooks/UseInstance';

export function BuildOrderDetailsPanel({
  instance,
  allowImageEdit = false,
  refreshInstance
}: Readonly<{
  instance: any;
  allowImageEdit?: boolean;
  refreshInstance?: () => void;
}>) {
  const { instance: partRequirements } = useInstance({
    endpoint: ApiEndpoints.part_requirements,
    pk: instance?.part,
    hasPrimaryKey: true,
    defaultValue: {}
  });

  const data = useMemo(
    () => ({ ...instance, can_build: partRequirements?.can_build ?? 0 }),
    [instance, partRequirements]
  );

  const tl: DetailsField[] = [
    {
      type: 'link',
      name: 'part',
      label: t`货品`,
      model: ModelType.part
    },
    {
      type: 'text',
      name: 'part_detail.IPN',
      icon: 'part',
      label: t`货品编码`,
      hidden: !instance?.part_detail?.IPN,
      copy: true
    },
    {
      type: 'string',
      name: 'part_detail.revision',
      icon: 'revision',
      label: t`Revision`,
      hidden: !instance?.part_detail?.revision,
      copy: true
    },
    {
      type: 'status',
      name: 'status',
      label: t`状态`,
      model: ModelType.build
    },
    {
      type: 'status',
      name: 'status_custom_key',
      label: t`自定义状态`,
      model: ModelType.build,
      icon: 'status',
      hidden:
        !instance?.status_custom_key ||
        instance?.status_custom_key == instance?.status
    },
    {
      type: 'boolean',
      name: 'external',
      label: t`外部库位`,
      icon: 'manufacturers',
      hidden: !instance?.external
    },
    {
      type: 'text',
      name: 'reference',
      label: t`进货单号`,
      copy: true
    },
    {
      type: 'text',
      name: 'title',
      label: t`Description`,
      icon: 'description',
      copy: true
    },
    {
      type: 'link',
      name: 'parent',
      icon: 'builds',
      label: t`上级库位`,
      model_field: 'reference',
      model: ModelType.build,
      hidden: !instance?.parent
    }
  ];

  const tr: DetailsField[] = [
    {
      type: 'number',
      name: 'quantity',
      label: t`Build Quantity`
    },
    {
      type: 'number',
      name: 'can_build',
      unit: instance?.part_detail?.units,
      label: t`可组合数量`,
      hidden: partRequirements?.can_build === undefined
    },
    {
      type: 'progressbar',
      name: 'completed',
      icon: 'progress',
      total: instance?.quantity,
      progress: instance?.completed,
      label: t`已完成明细`
    },
    {
      type: 'link',
      name: 'sales_order',
      label: t`出货单`,
      icon: 'sales_orders',
      model: ModelType.salesorder,
      model_field: 'reference',
      hidden: !instance?.sales_order
    }
  ];

  const bl: DetailsField[] = [
    {
      type: 'text',
      name: 'issued_by',
      label: t`Issued By`,
      icon: 'user',
      badge: 'user',
      hidden: !instance?.issued_by
    },
    {
      type: 'text',
      name: 'responsible',
      label: t`负责人`,
      badge: 'owner',
      hidden: !instance?.responsible
    },
    {
      type: 'text',
      name: 'project_code_label',
      label: t`业务编号`,
      icon: 'reference',
      copy: true,
      hidden: !instance?.project_code
    },
    {
      type: 'link',
      name: 'take_from',
      icon: 'location',
      model: ModelType.stocklocation,
      label: t`Source Location`,
      backup_value: t`Any location`
    },
    {
      type: 'link',
      name: 'destination',
      icon: 'location',
      model: ModelType.stocklocation,
      label: t`入库库位`,
      hidden: !instance?.destination
    },
    {
      type: 'text',
      name: 'batch',
      label: t`Batch Code`,
      hidden: !instance?.batch,
      copy: true
    }
  ];

  const br: DetailsField[] = [
    {
      type: 'date',
      name: 'creation_date',
      label: t`创建日期`,
      icon: 'calendar',
      copy: true,
      hidden: !instance?.creation_date
    },
    {
      type: 'date',
      name: 'start_date',
      label: t`开始日期`,
      icon: 'calendar',
      copy: true,
      hidden: !instance?.start_date
    },
    {
      type: 'date',
      name: 'target_date',
      label: t`预计到货日期`,
      icon: 'calendar',
      copy: true,
      hidden: !instance?.target_date
    },
    {
      type: 'date',
      name: 'completion_date',
      label: t`Completed`,
      icon: 'calendar',
      copy: true,
      hidden: !instance?.completion_date
    }
  ];

  const parametersTable = useParameterDetailsGrid({
    model_type: ModelType.build,
    model_id: instance?.pk
  });

  if (!instance?.pk) return <Skeleton />;

  return (
    <ItemDetailsGrid
      tables={[
        { fields: tr, item: data },
        { fields: bl, item: data },
        { fields: br, item: data },
        parametersTable
      ]}
    >
      <Stack gap='xs'>
        <Grid grow>
          <DetailsImage
            appRole={allowImageEdit ? UserRoles.part : undefined}
            apiPath={apiUrl(ApiEndpoints.part_list, instance?.part)}
            src={
              instance?.part_detail?.image ?? instance?.part_detail?.thumbnail
            }
            pk={instance?.part}
            refresh={refreshInstance}
          />
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <DetailsTable fields={tl} item={data} />
          </Grid.Col>
        </Grid>
        <TagsList tags={instance?.tags} />
      </Stack>
    </ItemDetailsGrid>
  );
}
