import { t } from '@lingui/core/macro';
import { Accordion } from '@mantine/core';

import { StylishText } from '@lib/components/StylishText';
import { ManufacturerPartTable } from '../../tables/purchasing/ManufacturerPartTable';
import { SupplierPartTable } from '../../tables/purchasing/SupplierPartTable';

export default function PartSupplierDetail({
  partId
}: Readonly<{ partId: number }>) {
  return (
    <Accordion multiple defaultValue={['part-suppliers', 'part-manufacturers']}>
      <Accordion.Item value='part-suppliers'>
        <Accordion.Control>
          <StylishText size='lg'>{t`供货商`}</StylishText>
        </Accordion.Control>
        <Accordion.Panel>
          <SupplierPartTable partId={partId} />
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value='part-manufacturers'>
        <Accordion.Control>
          <StylishText size='lg'>{t`生产厂家/品牌`}</StylishText>
        </Accordion.Control>
        <Accordion.Panel>
          <ManufacturerPartTable partId={partId} />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
