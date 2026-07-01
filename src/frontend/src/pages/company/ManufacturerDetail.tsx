import { t } from '@lingui/core/macro';

import CompanyDetail from './CompanyDetail';

export default function ManufacturerDetail() {
  return (
    <CompanyDetail
      title={t`生产厂家/品牌`}
      breadcrumbs={[{ name: t`进货管理`, url: '/purchasing/' }]}
      last_crumb_url='/purchasing/manufacturer'
    />
  );
}
