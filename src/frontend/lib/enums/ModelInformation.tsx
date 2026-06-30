import { t } from '@lingui/core/macro';
import type { InvenTreeIconType } from '../types/Icons';
import { ApiEndpoints } from './ApiEndpoints';
import type { ModelType } from './ModelType';

export interface ModelInformationInterface {
  label: string;
  label_multiple: string;
  url_overview?: string;
  url_detail?: string;
  api_endpoint: ApiEndpoints;
  admin_url?: string;
  pk_field?: string;
  supports_barcode?: boolean;
  icon: keyof InvenTreeIconType;
}

export interface TranslatableModelInformationInterface
  extends Omit<ModelInformationInterface, 'label' | 'label_multiple'> {
  label: () => string;
  label_multiple: () => string;
}

export type ModelDict = {
  [key in keyof typeof ModelType]: TranslatableModelInformationInterface;
};

export const ModelInformationDict: ModelDict = {
  part: {
    label: () => t`货品`,
    label_multiple: () => t`货品`,
    url_overview: '/part/category/index/parts',
    url_detail: '/part/:pk/',
    api_endpoint: ApiEndpoints.part_list,
    admin_url: '/part/part/',
    supports_barcode: true,
    icon: 'part'
  },
  parameter: {
    label: () => t`货品参数`,
    label_multiple: () => t`货品参数`,
    api_endpoint: ApiEndpoints.parameter_list,
    icon: 'list_details'
  },
  parametertemplate: {
    label: () => t`参数模板`,
    label_multiple: () => t`参数模板`,
    api_endpoint: ApiEndpoints.parameter_template_list,
    admin_url: '/common/parametertemplate/',
    icon: 'list'
  },
  parttesttemplate: {
    label: () => t`质检模板`,
    label_multiple: () => t`质检模板`,
    url_detail: '/parttesttemplate/:pk/',
    api_endpoint: ApiEndpoints.part_test_template_list,
    icon: 'test'
  },
  supplierpart: {
    label: () => t`供货商货品`,
    label_multiple: () => t`供货商货品`,
    url_overview: '/purchasing/index/supplier-parts',
    url_detail: '/purchasing/supplier-part/:pk/',
    api_endpoint: ApiEndpoints.supplier_part_list,
    admin_url: '/company/supplierpart/',
    supports_barcode: true,
    icon: 'supplier_part'
  },
  manufacturerpart: {
    label: () => t`生产厂家货号`,
    label_multiple: () => t`生产厂家货号`,
    url_overview: '/purchasing/index/manufacturer-parts',
    url_detail: '/purchasing/manufacturer-part/:pk/',
    api_endpoint: ApiEndpoints.manufacturer_part_list,
    admin_url: '/company/manufacturerpart/',
    supports_barcode: true,
    icon: 'manufacturers'
  },
  partcategory: {
    label: () => t`货品分类`,
    label_multiple: () => t`货品分类`,
    url_overview: '/part/category/parts/subcategories',
    url_detail: '/part/category/:pk/',
    api_endpoint: ApiEndpoints.category_list,
    admin_url: '/part/partcategory/',
    icon: 'category'
  },
  stockitem: {
    label: () => t`库存批次`,
    label_multiple: () => t`库存批次`,
    url_overview: '/stock/location/index/stock-items',
    url_detail: '/stock/item/:pk/',
    api_endpoint: ApiEndpoints.stock_item_list,
    admin_url: '/stock/stockitem/',
    supports_barcode: true,
    icon: 'stock'
  },
  stocklocation: {
    label: () => t`冷库库位`,
    label_multiple: () => t`冷库库位`,
    url_overview: '/stock/location',
    url_detail: '/stock/location/:pk/',
    api_endpoint: ApiEndpoints.stock_location_list,
    admin_url: '/stock/stocklocation/',
    supports_barcode: true,
    icon: 'location'
  },
  stocklocationtype: {
    label: () => t`库位类型`,
    label_multiple: () => t`库位类型`,
    api_endpoint: ApiEndpoints.stock_location_type_list,
    icon: 'location'
  },
  stockhistory: {
    label: () => t`库存流水`,
    label_multiple: () => t`库存流水`,
    api_endpoint: ApiEndpoints.stock_tracking_list,
    icon: 'history'
  },
  build: {
    label: () => t`组合配货单`,
    label_multiple: () => t`组合配货单`,
    url_overview: '/manufacturing/index/buildorders/',
    url_detail: '/manufacturing/build-order/:pk/',
    api_endpoint: ApiEndpoints.build_order_list,
    admin_url: '/build/build/',
    supports_barcode: true,
    icon: 'build_order'
  },
  buildline: {
    label: () => t`组合配货明细`,
    label_multiple: () => t`组合配货明细`,
    url_overview: '/build/line',
    url_detail: '/build/line/:pk/',
    api_endpoint: ApiEndpoints.build_line_list,
    icon: 'build_order'
  },
  builditem: {
    label: () => t`组合配货批次`,
    label_multiple: () => t`组合配货批次`,
    api_endpoint: ApiEndpoints.build_item_list,
    icon: 'build_order'
  },
  company: {
    label: () => t`往来单位`,
    label_multiple: () => t`往来单位`,
    url_detail: '/company/:pk/',
    api_endpoint: ApiEndpoints.company_list,
    admin_url: '/company/company/',
    icon: 'building'
  },
  projectcode: {
    label: () => t`业务编号`,
    label_multiple: () => t`业务编号`,
    url_detail: '/project-code/:pk/',
    api_endpoint: ApiEndpoints.project_code_list,
    icon: 'list_details'
  },
  purchaseorder: {
    label: () => t`进货单`,
    label_multiple: () => t`进货单`,
    url_overview: '/purchasing/index/purchaseorders',
    url_detail: '/purchasing/purchase-order/:pk/',
    api_endpoint: ApiEndpoints.purchase_order_list,
    admin_url: '/order/purchaseorder/',
    supports_barcode: true,
    icon: 'purchase_orders'
  },
  purchaseorderlineitem: {
    label: () => t`进货明细`,
    label_multiple: () => t`进货明细`,
    api_endpoint: ApiEndpoints.purchase_order_line_list,
    icon: 'purchase_orders'
  },
  salesorder: {
    label: () => t`出货单`,
    label_multiple: () => t`出货单`,
    url_overview: '/sales/index/salesorders',
    url_detail: '/sales/sales-order/:pk/',
    api_endpoint: ApiEndpoints.sales_order_list,
    admin_url: '/order/salesorder/',
    supports_barcode: true,
    icon: 'sales_orders'
  },
  salesordershipment: {
    label: () => t`发货记录`,
    label_multiple: () => t`发货记录`,
    url_overview: '/sales/index/shipments',
    url_detail: '/sales/shipment/:pk/',
    admin_url: '/order/salesordershipment/',
    api_endpoint: ApiEndpoints.sales_order_shipment_list,
    supports_barcode: true,
    icon: 'shipment'
  },
  returnorder: {
    label: () => t`退货单`,
    label_multiple: () => t`退货单`,
    url_overview: '/sales/index/returnorders',
    url_detail: '/sales/return-order/:pk/',
    api_endpoint: ApiEndpoints.return_order_list,
    admin_url: '/order/returnorder/',
    supports_barcode: true,
    icon: 'return_orders'
  },
  returnorderlineitem: {
    label: () => t`退货明细`,
    label_multiple: () => t`退货明细`,
    api_endpoint: ApiEndpoints.return_order_line_list,
    icon: 'return_orders'
  },
  transferorder: {
    label: () => t`移库单`,
    label_multiple: () => t`移库单`,
    url_overview: '/stock/location/index/transfer-orders',
    url_detail: '/stock/transfer-order/:pk/',
    api_endpoint: ApiEndpoints.transfer_order_list,
    admin_url: '/order/transferorder/',
    supports_barcode: true,
    icon: 'transfer_orders'
  },
  transferorderlineitem: {
    label: () => t`移库明细`,
    label_multiple: () => t`移库明细`,
    api_endpoint: ApiEndpoints.transfer_order_line_list,
    icon: 'transfer-orders'
  },
  address: {
    label: () => t`地址`,
    label_multiple: () => t`地址`,
    url_detail: '/address/:pk/',
    api_endpoint: ApiEndpoints.address_list,
    icon: 'address'
  },
  contact: {
    label: () => t`联系人`,
    label_multiple: () => t`联系人`,
    url_detail: '/contact/:pk/',
    api_endpoint: ApiEndpoints.contact_list,
    icon: 'group'
  },
  owner: {
    label: () => t`负责人`,
    label_multiple: () => t`负责人`,
    url_detail: '/owner/:pk/',
    api_endpoint: ApiEndpoints.owner_list,
    icon: 'group'
  },
  user: {
    label: () => t`User`,
    label_multiple: () => t`Users`,
    url_detail: '/core/user/:pk/',
    api_endpoint: ApiEndpoints.user_list,
    icon: 'user'
  },
  group: {
    label: () => t`Group`,
    label_multiple: () => t`Groups`,
    url_detail: '/core/group/:pk/',
    api_endpoint: ApiEndpoints.group_list,
    admin_url: '/auth/group/',
    icon: 'group'
  },
  importsession: {
    label: () => t`Import Session`,
    label_multiple: () => t`Import Sessions`,
    url_overview: '/settings/admin/import',
    url_detail: '/import/:pk/',
    api_endpoint: ApiEndpoints.import_session_list,
    icon: 'import'
  },
  labeltemplate: {
    label: () => t`Label Template`,
    label_multiple: () => t`Label Templates`,
    url_overview: '/settings/admin/labels',
    url_detail: '/settings/admin/labels/:pk/',
    api_endpoint: ApiEndpoints.label_list,
    icon: 'labels'
  },
  reporttemplate: {
    label: () => t`Report Template`,
    label_multiple: () => t`Report Templates`,
    url_overview: '/settings/admin/reports',
    url_detail: '/settings/admin/reports/:pk/',
    api_endpoint: ApiEndpoints.report_list,
    icon: 'reports'
  },
  pluginconfig: {
    label: () => t`Plugin Configuration`,
    label_multiple: () => t`Plugin Configurations`,
    url_overview: '/settings/admin/plugin',
    url_detail: '/settings/admin/plugin/:pk/',
    api_endpoint: ApiEndpoints.plugin_list,
    icon: 'plugin'
  },
  contenttype: {
    label: () => t`Content Type`,
    label_multiple: () => t`Content Types`,
    api_endpoint: ApiEndpoints.content_type_list,
    icon: 'list_details'
  },
  selectionlist: {
    label: () => t`Selection List`,
    label_multiple: () => t`Selection Lists`,
    url_overview: '/settings/admin/part-parameters',
    api_endpoint: ApiEndpoints.selectionlist_list,
    icon: 'list_details'
  },
  selectionentry: {
    label: () => t`Selection Entry`,
    label_multiple: () => t`Selection Entries`,
    url_overview: '/settings/admin/part-parameters',
    api_endpoint: ApiEndpoints.selectionentry_list,
    icon: 'list_details'
  },
  error: {
    label: () => t`Error`,
    label_multiple: () => t`Errors`,
    api_endpoint: ApiEndpoints.error_report_list,
    url_overview: '/settings/admin/errors',
    url_detail: '/settings/admin/errors/:pk/',
    icon: 'exclamation'
  },
  tag: {
    label: () => t`Tag`,
    label_multiple: () => t`Tags`,
    api_endpoint: ApiEndpoints.tag_list,
    icon: 'tag'
  }
};
