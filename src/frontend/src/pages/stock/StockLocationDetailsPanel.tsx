import { t } from '@lingui/core/macro';
import { Group, Skeleton } from '@mantine/core';

import { ModelType } from '@lib/enums/ModelType';

import type { DetailsField } from '../../components/details/Details';
import { ItemDetailsGrid } from '../../components/details/ItemDetails';
import { useParameterDetailsGrid } from '../../components/details/ParameterDetailsGrid';
import { ApiIcon } from '../../components/items/ApiIcon';

export function StockLocationDetailsPanel({
  instance
}: Readonly<{
  instance: any;
}>) {
  const left: DetailsField[] = [
    {
      type: 'text',
      name: 'name',
      label: t`Name`,
      copy: true,
      value_formatter: () => (
        <Group gap='xs'>
          {instance?.icon && <ApiIcon name={instance.icon} />}
          {instance?.name}
        </Group>
      )
    },
    {
      type: 'text',
      name: 'pathstring',
      label: t`完整库位`,
      icon: 'sitemap',
      copy: true,
      hidden: !instance?.pathstring
    },
    {
      type: 'text',
      name: 'description',
      label: t`说明`,
      copy: true,
      hidden: !instance?.description
    },
    {
      type: 'link',
      name: 'parent',
      model_field: 'name',
      icon: 'location',
      label: t`上级库位`,
      model: ModelType.stocklocation,
      hidden: !instance?.parent
    }
  ];

  const right: DetailsField[] = [
    {
      type: 'text',
      name: 'items',
      icon: 'stock',
      label: t`库存批次`,
      value_formatter: () => instance?.items || '0'
    },
    {
      type: 'text',
      name: 'sublocations',
      icon: 'location',
      label: t`下级库位`,
      hidden: !instance?.sublocations
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
      name: 'location_type_detail.name',
      label: t`库位类型`,
      hidden: !instance?.location_type,
      icon: 'packages'
    }
  ];

  const parametersTable = useParameterDetailsGrid({
    model_type: ModelType.stocklocation,
    model_id: instance?.pk
  });

  if (!instance?.pk) return <Skeleton />;

  return (
    <ItemDetailsGrid
      tables={[
        { item: instance, fields: left },
        { item: instance, fields: right },
        parametersTable
      ]}
    />
  );
}
