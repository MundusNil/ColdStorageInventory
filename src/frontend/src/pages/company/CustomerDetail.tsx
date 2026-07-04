import { t } from '@lingui/core/macro';

import CompanyDetail from './CompanyDetail';

export default function CustomerDetail() {
  return (
    <CompanyDetail
      title={t`客户`}
      breadcrumbs={[{ name: t`销售管理`, url: '/sales/' }]}
      last_crumb_url='/sales/customer'
    />
  );
}
