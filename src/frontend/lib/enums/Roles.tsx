import { t } from '@lingui/core/macro';

/*
 * Enumeration of available user role groups
 */
export enum UserRoles {
  admin = 'admin',
  bom = 'bom',
  build = 'build',
  part = 'part',
  part_category = 'part_category',
  purchase_order = 'purchase_order',
  return_order = 'return_order',
  transfer_order = 'transfer_order',
  sales_order = 'sales_order',
  stock = 'stock',
  stock_location = 'stock_location'
}

/*
 * Enumeration of available user permissions within each role group
 */
export enum UserPermissions {
  view = 'view',
  add = 'add',
  change = 'change',
  delete = 'delete'
}

export function userRoleLabel(role: UserRoles): string {
  switch (role) {
    case UserRoles.admin:
      return t`系统管理`;
    case UserRoles.build:
      return t`组合配货单`;
    case UserRoles.part:
      return t`货品`;
    case UserRoles.part_category:
      return t`货品分类`;
    case UserRoles.purchase_order:
      return t`进货单`;
    case UserRoles.return_order:
      return t`退货单`;
    case UserRoles.transfer_order:
      return t`移库单`;
    case UserRoles.sales_order:
      return t`出货单`;
    case UserRoles.stock:
      return t`库存批次`;
    case UserRoles.stock_location:
      return t`冷库库位`;
    default:
      return role as string;
  }
}
