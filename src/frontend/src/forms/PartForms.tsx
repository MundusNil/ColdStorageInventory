import type { ApiFormFieldSet } from '@lib/types/Forms';
import { t } from '@lingui/core/macro';
import { IconBuildingStore, IconCopy, IconPackages } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useGlobalSettingsState } from '../states/SettingsStates';
import { TagsField } from './CommonFields';

/**
 * Construct a set of fields for creating / editing a Part instance
 */
export function usePartFields({
  create = false,
  partId,
  duplicatePartInstance
}: {
  partId?: number;
  duplicatePartInstance?: any;
  create?: boolean;
}): ApiFormFieldSet {
  const globalSettings = useGlobalSettingsState();

  const [virtual, setVirtual] = useState<boolean | undefined>(undefined);
  const [purchaseable, setPurchaseable] = useState<boolean | undefined>(
    undefined
  );

  // Set the initial state for the tracked fields based on the global settings
  useEffect(() => {
    setVirtual(globalSettings.isSet('PART_VIRTUAL'));
    setPurchaseable(globalSettings.isSet('PART_PURCHASEABLE'));
  }, [partId, create]);

  return useMemo(() => {
    const fields: ApiFormFieldSet = {
      category: {
        label: t`货品分类`,
        filters: {
          structural: false
        }
      },
      name: {
        label: t`货品名称`
      },
      IPN: {
        label: t`货品编码`
      },
      description: {
        label: t`说明`
      },
      revision: {
        label: t`规格版本`
      },
      revision_of: {
        label: t`关联规格`,
        filters: {
          is_template: false,
          assembly: globalSettings.isSet('PART_REVISION_ASSEMBLY_ONLY')
            ? true
            : undefined
        }
      },
      variant_of: {
        label: t`所属模板货品`,
        filters: {
          is_template: true
        }
      },
      keywords: {
        label: t`搜索关键词`
      },
      tags: TagsField({}),
      units: {
        label: t`计量单位`
      },
      link: {
        label: t`外部链接`
      },
      default_location: {
        label: t`默认库位`,
        filters: {
          structural: false
        }
      },
      default_expiry: {
        label: t`默认保质期`
      },
      minimum_stock: {
        label: t`最低库存`
      },
      maximum_stock: {
        label: t`最高库存`
      },
      responsible: {
        label: t`负责人`,
        filters: {
          is_active: true
        }
      },
      component: {
        label: t`可作为配货组成`,
        default: globalSettings.isSet('PART_COMPONENT')
      },
      assembly: {
        label: t`组合货品`,
        default: globalSettings.isSet('PART_ASSEMBLY')
      },
      is_template: {
        label: t`模板货品`,
        default: globalSettings.isSet('PART_TEMPLATE')
      },
      testable: {
        label: t`需要质检`,
        default: false
      },
      trackable: {
        label: t`追踪批次/条码`,
        default: globalSettings.isSet('PART_TRACKABLE')
      },
      purchaseable: {
        label: t`可进货`,
        value: purchaseable,
        default: globalSettings.isSet('PART_PURCHASEABLE'),
        onValueChange: (value: boolean) => {
          setPurchaseable(value);
        }
      },
      salable: {
        label: t`可出货`,
        default: globalSettings.isSet('PART_SALABLE')
      },
      virtual: {
        label: t`虚拟货品`,
        default: globalSettings.isSet('PART_VIRTUAL'),
        value: virtual,
        onValueChange: (value: boolean) => {
          setVirtual(value);
        }
      },
      locked: {
        label: t`锁定货品`
      },
      active: {
        label: t`启用`
      },
      starred: {
        field_type: 'boolean',
        label: t`订阅`,
        description: t`订阅此货品的通知`,
        disabled: false,
        required: false
      }
    };

    // Additional fields for creation
    if (create && !virtual) {
      fields.copy_category_parameters = {};

      if (virtual != false) {
        fields.initial_stock = {
          icon: <IconPackages />,
          children: {
            quantity: {
              label: t`初始库存`,
              value: 0
            },
            location: {
              label: t`初始库位`
            }
          }
        };
      }

      if (purchaseable) {
        fields.initial_supplier = {
          icon: <IconBuildingStore />,
          children: {
            supplier: {
              label: t`供货商`,
              filters: {
                is_supplier: true
              }
            },
            sku: {
              label: t`供货商货号`
            },
            manufacturer: {
              label: t`生产厂家/品牌`,
              filters: {
                is_manufacturer: true
              }
            },
            mpn: {
              label: t`厂家货号`
            }
          }
        };
      }
    }

    // Additional fields for part duplication
    if (create && duplicatePartInstance?.pk) {
      fields.duplicate = {
        icon: <IconCopy />,
        children: {
          original: {
            value: duplicatePartInstance?.pk,
            hidden: true
          },
          copy_image: {
            label: t`复制图片`,
            value: true
          },
          copy_bom: {
            label: t`复制组合清单`,
            value: globalSettings.isSet('PART_COPY_BOM'),
            hidden: !duplicatePartInstance?.assembly
          },
          copy_notes: {
            label: t`复制备注`,
            value: true
          },
          copy_parameters: {
            label: t`复制参数`,
            value: globalSettings.isSet('PART_COPY_PARAMETERS')
          },
          copy_tests: {
            label: t`复制质检项`,
            value: true,
            hidden: !duplicatePartInstance?.testable
          }
        }
      };
    }

    if (globalSettings.isSet('PART_REVISION_ASSEMBLY_ONLY')) {
      fields.revision_of.filters['assembly'] = true;
    }

    // Pop 'revision' field if PART_ENABLE_REVISION is False
    if (!globalSettings.isSet('PART_ENABLE_REVISION')) {
      delete fields['revision'];
      delete fields['revision_of'];
    }

    // Pop 'expiry' field if expiry not enabled
    if (!globalSettings.isSet('STOCK_ENABLE_EXPIRY')) {
      delete fields['default_expiry'];
    }

    // Remove "locked" field if locking not enabled
    if (!globalSettings.isSet('PART_ENABLE_LOCKING')) {
      delete fields['locked'];
    }

    if (create) {
      delete fields['starred'];
    }

    return fields;
  }, [
    partId,
    virtual,
    purchaseable,
    create,
    globalSettings,
    duplicatePartInstance
  ]);
}

/**
 * Construct a set of fields for creating / editing a PartCategory instance
 */
export function partCategoryFields({
  create
}: {
  create?: boolean;
}): ApiFormFieldSet {
  const fields: ApiFormFieldSet = useMemo(() => {
    const fields: ApiFormFieldSet = {
      parent: {
        label: t`上级分类`,
        description: t`上级货品分类`,
        required: false
      },
      name: {
        label: t`分类名称`
      },
      description: {
        label: t`说明`
      },
      default_location: {
        label: t`默认库位`,
        filters: {
          structural: false
        }
      },
      default_keywords: {
        label: t`默认关键词`
      },
      structural: {
        label: t`仅作为分类节点`
      },
      starred: {
        field_type: 'boolean',
        label: t`订阅`,
        description: t`订阅此分类的通知`,
        disabled: false,
        required: false
      },
      icon: {
        field_type: 'icon'
      }
    };

    if (create) {
      delete fields['starred'];
    }

    return fields;
  }, [create]);

  return fields;
}

export function partStocktakeFields(): ApiFormFieldSet {
  return {
    part: {
      hidden: true
    },
    quantity: {},
    item_count: {},
    cost_min: {},
    cost_min_currency: {},
    cost_max: {},
    cost_max_currency: {}
  };
}
