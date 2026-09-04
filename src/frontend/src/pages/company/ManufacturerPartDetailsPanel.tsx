import { t } from '@lingui/core/macro';
import { Grid, Skeleton, Stack } from '@mantine/core';

import TagsList from '@lib/components/TagsList';
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { UserRoles } from '@lib/enums/Roles';
import { apiUrl } from '@lib/functions/Api';

import {
  type DetailsField,
  DetailsTable
} from '../../components/details/Details';
import { DetailsImage } from '../../components/details/DetailsImage';
import { ItemDetailsGrid } from '../../components/details/ItemDetails';
import { useParameterDetailsGrid } from '../../components/details/ParameterDetailsGrid';

export function ManufacturerPartDetailsPanel({
  instance,
  allowImageEdit = false,
  refreshInstance
}: Readonly<{
  instance: any;
  allowImageEdit?: boolean;
  refreshInstance?: () => void;
}>) {
  const tl: DetailsField[] = [
    {
      type: 'link',
      name: 'part',
      label: t`货品`,
      model: ModelType.part,
      hidden: !instance?.part
    },
    {
      type: 'string',
      name: 'part_detail.IPN',
      label: t`货品编码`,
      copy: true,
      icon: 'serial',
      hidden: !instance?.part_detail?.IPN
    },
    {
      type: 'string',
      name: 'part_detail.description',
      label: t`说明`,
      copy: true,
      icon: 'info',
      hidden: !instance?.description
    }
  ];

  const tr: DetailsField[] = [
    {
      type: 'link',
      name: 'manufacturer',
      label: t`生产厂家/品牌`,
      icon: 'manufacturers',
      model: ModelType.company,
      hidden: !instance?.manufacturer
    },
    {
      type: 'string',
      name: 'MPN',
      label: t`厂家货号`,
      copy: true,
      hidden: !instance?.MPN,
      icon: 'reference'
    },
    {
      type: 'string',
      name: 'description',
      label: t`说明`,
      copy: true,
      hidden: !instance?.description,
      icon: 'info'
    },
    {
      type: 'link',
      external: true,
      name: 'link',
      label: t`外部链接`,
      copy: true,
      hidden: !instance?.link
    }
  ];

  const parametersTable = useParameterDetailsGrid({
    model_type: ModelType.manufacturerpart,
    model_id: instance?.pk
  });

  if (!instance?.pk) return <Skeleton />;

  return (
    <ItemDetailsGrid
      tables={[
        { title: t`Manufacturer Details`, fields: tr, item: instance },
        parametersTable
      ]}
    >
      <Stack gap='xs'>
        <Grid grow>
          <DetailsImage
            appRole={allowImageEdit ? UserRoles.part : undefined}
            src={instance?.part_detail?.image}
            apiPath={apiUrl(ApiEndpoints.part_list, instance?.part_detail?.pk)}
            pk={instance?.part_detail?.pk}
            refresh={refreshInstance}
          />
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <DetailsTable title={t`Part Details`} fields={tl} item={instance} />
          </Grid.Col>
        </Grid>
        <TagsList tags={instance?.tags} />
      </Stack>
    </ItemDetailsGrid>
  );
}
