import type {
  ApiFormAdjustFilterType,
  ApiFormFieldSet
} from '@lib/types/Forms';
import { t } from '@lingui/core/macro';
import {
  IconAt,
  IconCurrencyDollar,
  IconGlobe,
  IconHash,
  IconLink,
  IconNote,
  IconPackage,
  IconPhone
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { DuplicateField, TagsField } from './CommonFields';

/**
 * Field set for SupplierPart instance
 */
export function useSupplierPartFields({
  manufacturerId,
  manufacturerPartId,
  partId,
  duplicateSupplierPartId
}: {
  manufacturerId?: number;
  manufacturerPartId?: number;
  partId?: number;
  duplicateSupplierPartId?: number | null;
}) {
  const [part, setPart] = useState<any>({});

  return useMemo(() => {
    const fields: ApiFormFieldSet = {
      part: {
        label: t`货品`,
        value: partId,
        disabled: !!partId,
        filters: {
          part: partId,
          purchaseable: true,
          active: true
        },
        onValueChange: (value: any, record: any) => {
          setPart(record);
        }
      },
      manufacturer_part: {
        label: t`生产厂家货号`,
        value: manufacturerPartId,
        autoFill: true,
        filters: {
          manufacturer: manufacturerId,
          part_detail: true,
          manufacturer_detail: true
        },
        adjustFilters: (adjust: ApiFormAdjustFilterType) => {
          return {
            ...adjust.filters,
            part: adjust.data.part
          };
        },
        addCreateFields: {
          part: {
            label: t`货品`,
            value: part?.pk,
            disabled: !!part?.pk
          },
          manufacturer: {
            label: t`生产厂家/品牌`
          },
          MPN: {
            label: t`厂家货号`
          },
          description: {
            label: t`说明`
          },
          link: {
            label: t`外部链接`
          }
        }
      },
      supplier: {
        label: t`供货商`,
        filters: {
          active: true,
          is_supplier: true
        },
        addCreateFields: {
          name: {
            label: t`单位名称`
          },
          description: {
            label: t`说明`
          },
          is_supplier: { value: true, hidden: true }
        }
      },
      SKU: {
        label: t`供货商货号`,
        icon: <IconHash />
      },
      description: {
        label: t`说明`
      },
      tags: TagsField({}),
      link: {
        label: t`外部链接`,
        icon: <IconLink />
      },
      note: {
        label: t`备注`,
        icon: <IconNote />
      },
      pack_quantity: {
        label: t`包装数量`
      },
      packaging: {
        label: t`包装说明`,
        icon: <IconPackage />
      },
      primary: {
        label: t`首选供货商`
      },
      active: {
        label: t`启用`
      },
      duplicate: DuplicateField({
        originalId: duplicateSupplierPartId,
        extraFields: {
          copy_parameters: {}
        }
      })
    };

    if (!duplicateSupplierPartId) {
      delete fields.duplicate;
    }

    return fields;
  }, [
    manufacturerId,
    manufacturerPartId,
    partId,
    part,
    duplicateSupplierPartId
  ]);
}

export function useManufacturerPartFields({
  duplicateManufacturerPartId
}: {
  duplicateManufacturerPartId?: number | null;
} = {}) {
  return useMemo(() => {
    const fields: ApiFormFieldSet = {
      part: {
        label: t`货品`
      },
      manufacturer: {
        label: t`生产厂家/品牌`,
        filters: {
          active: true,
          is_manufacturer: true
        },
        addCreateFields: {
          name: {
            label: t`单位名称`
          },
          description: {
            label: t`说明`
          },
          is_manufacturer: { value: true, hidden: true }
        }
      },
      MPN: {
        label: t`厂家货号`
      },
      description: {
        label: t`说明`
      },
      tags: TagsField({}),
      link: {
        label: t`外部链接`
      },
      duplicate: DuplicateField({
        originalId: duplicateManufacturerPartId,
        extraFields: {
          copy_parameters: {}
        }
      })
    };

    if (!duplicateManufacturerPartId) {
      delete fields.duplicate;
    }

    return fields;
  }, [duplicateManufacturerPartId]);
}

/**
 * Field set for editing a company instance
 */
export function companyFields({
  duplicateCompanyId
}: {
  duplicateCompanyId?: number | null;
} = {}): ApiFormFieldSet {
  const fields: ApiFormFieldSet = {
    name: {
      label: t`单位名称`
    },
    description: {
      label: t`说明`
    },
    website: {
      label: t`网站`,
      icon: <IconGlobe />
    },
    currency: {
      label: t`默认币种`,
      icon: <IconCurrencyDollar />
    },
    phone: {
      label: t`电话`,
      icon: <IconPhone />
    },
    email: {
      label: t`邮箱`,
      icon: <IconAt />
    },
    tags: TagsField({}),
    tax_id: {
      label: t`税号`
    },
    is_supplier: {
      label: t`供货商`
    },
    is_manufacturer: {
      label: t`生产厂家/品牌`
    },
    is_customer: {
      label: t`客户`
    },
    active: {
      label: t`启用`
    },
    duplicate: DuplicateField({
      originalId: duplicateCompanyId,
      extraFields: {
        copy_parameters: {}
      }
    })
  };

  if (!duplicateCompanyId) {
    delete fields.duplicate;
  }

  return fields;
}
