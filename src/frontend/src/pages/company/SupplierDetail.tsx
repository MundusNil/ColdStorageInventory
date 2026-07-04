import { t } from '@lingui/core/macro';

import CompanyDetail from './CompanyDetail';

export default function SupplierDetail() {
  return (
    <CompanyDetail
      title={t`供货商`}
      breadcrumbs={[{ name: t`进货管理`, url: '/purchasing/' }]}
      last_crumb_url='/purchasing/supplier'
    />
  );
}
