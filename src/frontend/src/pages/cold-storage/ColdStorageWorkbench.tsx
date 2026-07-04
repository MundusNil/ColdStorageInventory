import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowsExchange,
  IconBuildingWarehouse,
  IconClipboardCheck,
  IconInfoCircle,
  IconPackageExport,
  IconPackageImport,
  IconSearch,
  IconTrash
} from '@tabler/icons-react';
import { ApiEndpoints, apiUrl } from '@lib/index';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import PageTitle from '../../components/nav/PageTitle';
import { useApi } from '../../contexts/ApiContext';
import { useStockFields } from '../../forms/StockForms';
import { showApiErrorMessage } from '../../functions/notifications';
import { useCreateApiFormModal } from '../../hooks/UseForm';
import ColdStorageStockCards, {
  type ColdStorageStockRecord
} from './ColdStorageStockCards';
import { displayStockQuantity, displayText } from './coldStorageDisplay';

type DraftAction = 'inbound' | 'outbound' | 'transfer' | 'count' | 'waste';

type WorkbenchActionKind = 'search' | DraftAction;

type FieldKind = 'text' | 'number' | 'date' | 'textarea' | 'select';

type DraftField = {
  label: string;
  placeholder?: string;
  kind?: FieldKind;
  description?: string;
  defaultValue?: string | number;
  readOnly?: boolean;
  options?: string[];
};

type WorkbenchActionStatus = 'live' | 'draft' | 'readonly';

type WorkbenchAction = {
  title: string;
  description: string;
  status: WorkbenchActionStatus;
  icon: ReactNode;
  buttonLabel: string;
  kind: WorkbenchActionKind;
};

type DraftDialog = {
  title: string;
  warning: string;
  color: string;
  submitLabel: string;
  fields: DraftField[];
};

type OutboundFormState = {
  customer: string;
  quantity: number | string;
  unitPrice: number | string;
  outboundDate: string;
  notes: string;
};

type TransferFormState = {
  location: string | null;
  quantity: number | string;
  transferDate: string;
  notes: string;
};

type CountFormState = {
  quantity: number | string;
  reason: string | null;
  countDate: string;
  notes: string;
};

type WasteFormState = {
  quantity: number | string;
  reason: string | null;
  wasteDate: string;
  notes: string;
};

type StockLocationRecord = {
  pk: number;
  name?: string;
  pathstring?: string;
};

const actions: WorkbenchAction[] = [
  {
    title: '新货入库',
    description: '创建真实库存批次，录入货品、数量、库位、批次、到期日期和进价。',
    status: 'live',
    icon: <IconPackageImport />,
    buttonLabel: '新增库存批次',
    kind: 'inbound'
  },
  {
    title: '出库扣数',
    description: '先在下方库存卡片找到批次号，再填写客户、数量和价格，提交后真实扣减库存。',
    status: 'live',
    icon: <IconPackageExport />,
    buttonLabel: '先选择库存批次号',
    kind: 'outbound'
  },
  {
    title: '查库存',
    description: '按品名、库位、批次查当前库存。',
    status: 'readonly',
    icon: <IconSearch />,
    buttonLabel: '见下方库存卡片',
    kind: 'search'
  },
  {
    title: '改库位',
    description: '从库存卡片选择批次后，真实移动到新的库位。',
    status: 'live',
    icon: <IconArrowsExchange />,
    buttonLabel: '先选择库存批次号',
    kind: 'transfer'
  },
  {
    title: '盘点改数',
    description: '从库存卡片选择批次后，录入现场实际数量并同步库存。',
    status: 'live',
    icon: <IconClipboardCheck />,
    buttonLabel: '先选择库存批次号',
    kind: 'count'
  },
  {
    title: '报损/过期',
    description: '从库存卡片选择批次后，按原因真实扣减报损数量。',
    status: 'live',
    icon: <IconTrash />,
    buttonLabel: '先选择库存批次号',
    kind: 'waste'
  }
];

const draftDialogs: Record<DraftAction, DraftDialog> = {
  inbound: {
    title: '新货入库单',
    warning:
      '当前先按冷库业务重新设计字段，不提交库存数据。字段确认稳定后，再把这些字段接到真实入库保存流程。',
    color: 'teal',
    submitLabel: '字段确认后接入入库保存',
    fields: [
      {
        label: '货品',
        placeholder: '输入或搜索货品名称，例如：大虾、冻鸡腿'
      },
      { label: '数量', placeholder: '输入本批入库数量', kind: 'number' },
      { label: '进价', placeholder: '输入本批进价', kind: 'number' },
      { label: '生产日期', kind: 'date' },
      { label: '供货商', placeholder: '输入供货商名称' },
      { label: '存放库位', placeholder: '选择或填写本批货存放位置' },
      {
        label: '批次号',
        placeholder: '保存时按“货品名-生产日期-序号”生成',
        readOnly: true
      },
      {
        label: '到期日期',
        placeholder: '按货品主档保质期自动计算',
        readOnly: true
      },
      {
        label: '单位',
        placeholder: '来自货品主档',
        readOnly: true
      },
      {
        label: '入库日期',
        kind: 'date',
        defaultValue: new Date().toISOString().slice(0, 10),
        readOnly: true
      },
      {
        label: '操作人',
        placeholder: '当前登录账号',
        readOnly: true
      },
      {
        label: '备注',
        placeholder: '车牌、温度、临时说明等情况',
        kind: 'textarea'
      }
    ]
  },
  outbound: {
    title: '出库扣数单',
    warning:
      '该表单会真实扣减所选库存批次数量，并把客户、价格和备注写入库存流水备注。请确认批次和数量后再提交。',
    color: 'orange',
    submitLabel: '确认出库扣数',
    fields: [
      { label: '货品', placeholder: '从库存卡片带出', readOnly: true },
      { label: '批次号', placeholder: '从库存卡片带出', readOnly: true },
      { label: '出库库位', placeholder: '从库存卡片带出', readOnly: true },
      { label: '当前库存', placeholder: '从库存卡片带出', readOnly: true },
      { label: '客户', placeholder: '输入客户或去向' },
      { label: '出库数量', placeholder: '输入本次扣减数量', kind: 'number' },
      { label: '单价', placeholder: '输入出库单价', kind: 'number' },
      {
        label: '总价',
        placeholder: '按单价乘数量自动计算',
        kind: 'number'
      },
      {
        label: '出库日期',
        kind: 'date',
        defaultValue: new Date().toISOString().slice(0, 10),
        readOnly: true
      },
      {
        label: '操作人',
        placeholder: '当前登录账号',
        readOnly: true
      },
      {
        label: '备注',
        placeholder: '司机、车牌、门店、纸质单号等情况',
        kind: 'textarea'
      }
    ]
  },
  transfer: {
    title: '改库位单',
    warning:
      '当前只确认移库字段，不移动库存。新库位固定列表和整批移动规则确认后再接真实保存。',
    color: 'violet',
    submitLabel: '字段确认后接入移库',
    fields: [
      { label: '货品', placeholder: '选择要移库的货品' },
      { label: '批次号', placeholder: '选择要移动的批次号' },
      { label: '原库位', placeholder: '从当前库存带出' },
      { label: '新库位', placeholder: '从固定库位中选择，当前先填写名称' },
      { label: '移动数量', placeholder: '不填表示整批移动', kind: 'number' },
      {
        label: '移动日期',
        kind: 'date',
        defaultValue: new Date().toISOString().slice(0, 10),
        readOnly: true
      },
      { label: '操作人', placeholder: '当前登录账号', readOnly: true },
      {
        label: '备注',
        placeholder: '临时腾库、串库整理等情况',
        kind: 'textarea'
      }
    ]
  },
  count: {
    title: '盘点改数单',
    warning:
      '当前只确认盘点字段，不覆盖库存数量。差异原因和老板确认流程稳定后再接真实保存。',
    color: 'grape',
    submitLabel: '字段确认后接入盘点保存',
    fields: [
      { label: '货品', placeholder: '选择盘点货品' },
      { label: '批次号', placeholder: '选择盘点批次号' },
      { label: '库位', placeholder: '选择盘点库位' },
      {
        label: '系统数量',
        placeholder: '从当前库存带出',
        readOnly: true
      },
      { label: '实际数量', placeholder: '现场清点数量', kind: 'number' },
      {
        label: '差异原因',
        placeholder: '选择差异原因',
        kind: 'select',
        options: ['少货', '多货', '录错', '损耗', '未知']
      },
      {
        label: '差异数量',
        placeholder: '按实际数量减系统数量计算',
        readOnly: true
      },
      {
        label: '盘点日期',
        kind: 'date',
        defaultValue: new Date().toISOString().slice(0, 10),
        readOnly: true
      },
      { label: '盘点人', placeholder: '当前登录账号', readOnly: true },
      {
        label: '备注',
        placeholder: '说明盘点现场情况或后续处理方式',
        kind: 'textarea'
      }
    ]
  },
  waste: {
    title: '报损/过期单',
    warning:
      '当前只确认报损字段，不扣减库存。原因分类和处理责任确认后再接真实保存。',
    color: 'red',
    submitLabel: '字段确认后接入报损保存',
    fields: [
      { label: '货品', placeholder: '选择报损货品' },
      { label: '批次号', placeholder: '选择报损批次号' },
      { label: '库位', placeholder: '选择报损库位' },
      { label: '数量', placeholder: '输入报损数量', kind: 'number' },
      {
        label: '原因',
        placeholder: '选择报损原因',
        kind: 'select',
        options: ['过期', '破损', '化冻', '污染', '其他']
      },
      {
        label: '处理日期',
        kind: 'date',
        defaultValue: new Date().toISOString().slice(0, 10),
        readOnly: true
      },
      { label: '操作人', placeholder: '当前登录账号', readOnly: true },
      {
        label: '备注',
        placeholder: '拍照、主管确认、处理方式等情况',
        kind: 'textarea'
      }
    ]
  }
};

function actionStatusColor(status: WorkbenchActionStatus) {
  if (status === 'live') {
    return 'green';
  }

  if (status === 'draft') {
    return 'blue';
  }

  return 'gray';
}

function actionStatusLabel(status: WorkbenchActionStatus) {
  if (status === 'live') {
    return '已接入';
  }

  if (status === 'draft') {
    return '字段草稿';
  }

  return '只读';
}

function getDraftDialog(
  action: DraftAction | null,
  selectedOutboundItem: ColdStorageStockRecord | null
): DraftDialog | null {
  if (!action) {
    return null;
  }

  const dialog = draftDialogs[action];

  if (action !== 'outbound' || !selectedOutboundItem) {
    return dialog;
  }

  const partName = displayText(
    selectedOutboundItem.part_detail?.full_name ||
      selectedOutboundItem.part_detail?.name
  );
  const location = displayText(
    selectedOutboundItem.location_detail?.pathstring ||
      selectedOutboundItem.location_detail?.name
  );

  return {
    ...dialog,
    fields: dialog.fields.map((field) => {
      if (field.label === '货品') {
        return { ...field, defaultValue: partName };
      }

      if (field.label === '批次号') {
        return { ...field, defaultValue: displayText(selectedOutboundItem.batch) };
      }

      if (field.label === '出库库位') {
        return { ...field, defaultValue: location };
      }

      if (field.label === '当前库存') {
        return { ...field, defaultValue: displayStockQuantity(selectedOutboundItem) };
      }

      return field;
    })
  };
}

function renderDraftField(field: DraftField) {
  if (field.kind === 'select') {
    return (
      <Select
        key={field.label}
        label={field.label}
        placeholder={field.placeholder}
        description={field.description}
        data={field.options ?? []}
      />
    );
  }

  if (field.kind === 'textarea') {
    return (
      <Textarea
        key={field.label}
        label={field.label}
        placeholder={field.placeholder}
        description={field.description}
        defaultValue={field.defaultValue?.toString()}
        readOnly={field.readOnly}
        minRows={3}
      />
    );
  }

  if (field.kind === 'number') {
    return (
      <NumberInput
        key={field.label}
        label={field.label}
        placeholder={field.placeholder}
        description={field.description}
        defaultValue={
          typeof field.defaultValue === 'number' ? field.defaultValue : undefined
        }
        readOnly={field.readOnly}
        min={0}
      />
    );
  }

  return (
    <TextInput
      key={field.label}
      label={field.label}
      placeholder={field.placeholder}
      description={field.description}
      type={field.kind === 'date' ? 'date' : 'text'}
      defaultValue={field.defaultValue?.toString()}
      readOnly={field.readOnly}
    />
  );
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function createOutboundForm(): OutboundFormState {
  return {
    customer: '',
    quantity: '',
    unitPrice: '',
    outboundDate: todayString(),
    notes: ''
  };
}

function createTransferForm(): TransferFormState {
  return {
    location: null,
    quantity: '',
    transferDate: todayString(),
    notes: ''
  };
}

function createCountForm(item: ColdStorageStockRecord | null): CountFormState {
  return {
    quantity: item?.quantity ?? '',
    reason: null,
    countDate: todayString(),
    notes: ''
  };
}

function createWasteForm(): WasteFormState {
  return {
    quantity: '',
    reason: null,
    wasteDate: todayString(),
    notes: ''
  };
}

function toNumber(value: number | string | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function displayNumber(value: number | null, maximumFractionDigits = 5) {
  if (value === null) {
    return '';
  }

  return value.toLocaleString('zh-CN', {
    maximumFractionDigits
  });
}

function getStockQuantity(item: ColdStorageStockRecord | null) {
  return toNumber(item?.quantity);
}

function getPartName(item: ColdStorageStockRecord) {
  return displayText(item.part_detail?.full_name || item.part_detail?.name);
}

function getLocationName(item: ColdStorageStockRecord) {
  return displayText(
    item.location_detail?.pathstring || item.location_detail?.name
  );
}

function getLocationOptions(locations: StockLocationRecord[]) {
  return locations.map((location) => ({
    value: String(location.pk),
    label: displayText(location.pathstring || location.name, `库位 ${location.pk}`)
  }));
}

function buildStockAdjustmentItem(
  item: ColdStorageStockRecord,
  quantity: number
) {
  return {
    pk: item.pk,
    quantity,
    batch: item.batch || undefined,
    status: item.status || undefined,
    packaging: item.packaging || undefined
  };
}

function buildOutboundNotes({
  item,
  form,
  quantity,
  totalPrice
}: {
  item: ColdStorageStockRecord;
  form: OutboundFormState;
  quantity: number;
  totalPrice: number | null;
}) {
  const unitPrice = toNumber(form.unitPrice);
  const lines = [
    '冷库出库扣数',
    `货品：${getPartName(item)}`,
    `批次号：${displayText(item.batch, '无批次号')}`,
    `出库库位：${getLocationName(item)}`,
    `出库数量：${quantity}`,
    `客户/去向：${form.customer.trim()}`,
    `出库日期：${form.outboundDate || todayString()}`
  ];

  if (unitPrice !== null) {
    lines.push(`单价：${displayNumber(unitPrice, 2)}`);
  }

  if (totalPrice !== null) {
    lines.push(`总价：${displayNumber(totalPrice, 2)}`);
  }

  if (form.notes.trim()) {
    lines.push(`备注：${form.notes.trim()}`);
  }

  return lines.join('\n');
}

function buildTransferNotes({
  item,
  form,
  quantity,
  locationName
}: {
  item: ColdStorageStockRecord;
  form: TransferFormState;
  quantity: number;
  locationName: string;
}) {
  const lines = [
    '冷库改库位',
    `货品：${getPartName(item)}`,
    `批次号：${displayText(item.batch, '无批次号')}`,
    `原库位：${getLocationName(item)}`,
    `新库位：${locationName}`,
    `移动数量：${quantity}`,
    `移动日期：${form.transferDate || todayString()}`
  ];

  if (form.notes.trim()) {
    lines.push(`备注：${form.notes.trim()}`);
  }

  return lines.join('\n');
}

function buildCountNotes({
  item,
  form,
  quantity,
  stockQuantity
}: {
  item: ColdStorageStockRecord;
  form: CountFormState;
  quantity: number;
  stockQuantity: number | null;
}) {
  const lines = [
    '冷库盘点改数',
    `货品：${getPartName(item)}`,
    `批次号：${displayText(item.batch, '无批次号')}`,
    `库位：${getLocationName(item)}`,
    `账面数量：${stockQuantity === null ? '-' : stockQuantity}`,
    `实际数量：${quantity}`,
    `差异数量：${stockQuantity === null ? '-' : quantity - stockQuantity}`,
    `差异原因：${form.reason || '未填写'}`,
    `盘点日期：${form.countDate || todayString()}`
  ];

  if (form.notes.trim()) {
    lines.push(`备注：${form.notes.trim()}`);
  }

  return lines.join('\n');
}

function buildWasteNotes({
  item,
  form,
  quantity
}: {
  item: ColdStorageStockRecord;
  form: WasteFormState;
  quantity: number;
}) {
  const lines = [
    '冷库报损/过期',
    `货品：${getPartName(item)}`,
    `批次号：${displayText(item.batch, '无批次号')}`,
    `库位：${getLocationName(item)}`,
    `报损数量：${quantity}`,
    `原因：${form.reason || '未填写'}`,
    `处理日期：${form.wasteDate || todayString()}`
  ];

  if (form.notes.trim()) {
    lines.push(`备注：${form.notes.trim()}`);
  }

  return lines.join('\n');
}

export default function ColdStorageWorkbench() {
  const api = useApi();
  const [openedDraft, setOpenedDraft] = useState<DraftAction | null>(null);
  const [selectedOutboundItem, setSelectedOutboundItem] =
    useState<ColdStorageStockRecord | null>(null);
  const [outboundForm, setOutboundForm] = useState(createOutboundForm);
  const [transferForm, setTransferForm] = useState(createTransferForm);
  const [countForm, setCountForm] = useState<CountFormState>(() =>
    createCountForm(null)
  );
  const [wasteForm, setWasteForm] = useState(createWasteForm);
  const [outboundError, setOutboundError] = useState<string | undefined>();
  const [transferError, setTransferError] = useState<string | undefined>();
  const [countError, setCountError] = useState<string | undefined>();
  const [wasteError, setWasteError] = useState<string | undefined>();
  const [submittingAction, setSubmittingAction] = useState(false);
  const [locations, setLocations] = useState<StockLocationRecord[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationsError, setLocationsError] = useState<string | undefined>();
  const [stockRefreshSignal, setStockRefreshSignal] = useState(0);

  const refreshStock = () => setStockRefreshSignal((value) => value + 1);

  const stockFields = useStockFields({
    create: true,
    modalId: 'cold-storage-create-stock-item'
  });

  const inboundFields = useMemo(() => {
    const fields = { ...stockFields };

    if (fields.part) {
      fields.part = {
        ...fields.part,
        label: '货品',
        description: '选择要入库的货品'
      };
    }

    if (fields.location) {
      fields.location = {
        ...fields.location,
        label: '库位',
        description: '选择本批货存放位置'
      };
    }

    if (fields.quantity) {
      fields.quantity = {
        ...fields.quantity,
        label: '数量',
        description: '输入本批入库数量'
      };
    }

    if (fields.batch) {
      fields.batch = {
        ...fields.batch,
        label: '批次号',
        description: '可手动填写，也可以留空使用系统建议值'
      };
    }

    if (fields.expiry_date) {
      fields.expiry_date = {
        ...fields.expiry_date,
        label: '到期日期',
        description: '可手动填写；如货品主档设置了默认保质期，也可交给后端自动推算'
      };
    }

    if (fields.purchase_price) {
      fields.purchase_price = {
        ...fields.purchase_price,
        label: '进价'
      };
    }

    if (fields.purchase_price_currency) {
      fields.purchase_price_currency = {
        ...fields.purchase_price_currency,
        label: '进价币种'
      };
    }

    if (fields.packaging) {
      fields.packaging = {
        ...fields.packaging,
        label: '包装/单位说明',
        description: '例如：箱、袋、件、千克'
      };
    }

    [
      'supplier_part',
      'use_pack_size',
      'serial_numbers',
      'status_custom_key',
      'tags',
      'link',
      'owner',
      'delete_on_deplete'
    ].forEach((fieldName) => {
      if (fields[fieldName]) {
        fields[fieldName] = {
          ...fields[fieldName],
          hidden: true
        };
      }
    });

    return fields;
  }, [stockFields]);

  const createStock = useCreateApiFormModal({
    url: ApiEndpoints.stock_item_list,
    fields: inboundFields,
    modalId: 'cold-storage-create-stock-item',
    title: '新货入库',
    submitText: '确认入库',
    successMessage: '入库成功',
    keepOpenOption: true,
    onFormSuccess: refreshStock,
    preFormContent: (
      <Alert color='blue' icon={<IconInfoCircle />}>
        这里会创建真实库存批次。请先确认货品、数量和库位，再录入正式数据。
      </Alert>
    )
  });

  const draft = useMemo(
    () => getDraftDialog(openedDraft, selectedOutboundItem),
    [openedDraft, selectedOutboundItem]
  );

  const outboundQuantity = toNumber(outboundForm.quantity);
  const outboundUnitPrice = toNumber(outboundForm.unitPrice);
  const outboundTotal =
    outboundQuantity !== null && outboundUnitPrice !== null
      ? outboundQuantity * outboundUnitPrice
      : null;
  const selectedStockQuantity = getStockQuantity(selectedOutboundItem);
  const locationOptions = useMemo(() => getLocationOptions(locations), [locations]);
  const selectedTransferLocation = locationOptions.find(
    (location) => location.value === transferForm.location
  );
  const transferQuantity = toNumber(transferForm.quantity);
  const effectiveTransferQuantity =
    transferQuantity ?? selectedStockQuantity ?? null;
  const countQuantity = toNumber(countForm.quantity);
  const countDifference =
    countQuantity !== null && selectedStockQuantity !== null
      ? countQuantity - selectedStockQuantity
      : null;
  const wasteQuantity = toNumber(wasteForm.quantity);

  const closeDraft = () => {
    if (submittingAction) {
      return;
    }

    setOpenedDraft(null);
    setSelectedOutboundItem(null);
    setOutboundError(undefined);
    setTransferError(undefined);
    setCountError(undefined);
    setWasteError(undefined);
  };

  const fetchLocations = useCallback(async () => {
    setLocationsLoading(true);
    setLocationsError(undefined);

    try {
      const response = await api.get(apiUrl(ApiEndpoints.stock_location_list), {
        params: {
          limit: 1000,
          offset: 0,
          structural: false
        }
      });

      const data = response.data;
      const results = Array.isArray(data) ? data : (data?.results ?? []);
      setLocations(results);
    } catch (error: any) {
      setLocationsError('库位列表读取失败，请确认后端服务和权限。');
      showApiErrorMessage({
        error,
        title: '库位列表读取失败',
        message: '请确认后端服务和权限。',
        id: 'cold-storage-location-error'
      });
    } finally {
      setLocationsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (openedDraft === 'transfer' && locations.length === 0) {
      fetchLocations();
    }
  }, [fetchLocations, locations.length, openedDraft]);

  const openOutbound = (item: ColdStorageStockRecord) => {
    setSelectedOutboundItem(item);
    setOutboundForm(createOutboundForm());
    setOutboundError(undefined);
    setOpenedDraft('outbound');
  };

  const openTransfer = (item: ColdStorageStockRecord) => {
    setSelectedOutboundItem(item);
    setTransferForm(createTransferForm());
    setTransferError(undefined);
    setOpenedDraft('transfer');
  };

  const openCount = (item: ColdStorageStockRecord) => {
    setSelectedOutboundItem(item);
    setCountForm(createCountForm(item));
    setCountError(undefined);
    setOpenedDraft('count');
  };

  const openWaste = (item: ColdStorageStockRecord) => {
    setSelectedOutboundItem(item);
    setWasteForm(createWasteForm());
    setWasteError(undefined);
    setOpenedDraft('waste');
  };

  const submitOutbound = async () => {
    if (!selectedOutboundItem) {
      setOutboundError('请先从库存卡片选择要出库的批次。');
      return;
    }

    const quantity = toNumber(outboundForm.quantity);
    const stockQuantity = getStockQuantity(selectedOutboundItem);

    if (!outboundForm.customer.trim()) {
      setOutboundError('请填写客户或去向。');
      return;
    }

    if (quantity === null || quantity <= 0) {
      setOutboundError('请填写大于 0 的出库数量。');
      return;
    }

    if (stockQuantity !== null && quantity > stockQuantity) {
      setOutboundError('出库数量不能大于当前库存。');
      return;
    }

    setSubmittingAction(true);
    setOutboundError(undefined);

    try {
      await api.post(apiUrl(ApiEndpoints.stock_remove), {
        items: [
          buildStockAdjustmentItem(selectedOutboundItem, quantity)
        ],
        notes: buildOutboundNotes({
          item: selectedOutboundItem,
          form: outboundForm,
          quantity,
          totalPrice: outboundTotal
        })
      });

      notifications.show({
        title: '出库扣数完成',
        message: `${getPartName(selectedOutboundItem)} 已扣减 ${displayNumber(quantity)}。`,
        color: 'green'
      });

      setOpenedDraft(null);
      setSelectedOutboundItem(null);
      setOutboundForm(createOutboundForm());
      refreshStock();
    } catch (error: any) {
      setOutboundError('出库扣数失败，请检查数量、权限和后端服务状态。');
      showApiErrorMessage({
        error,
        title: '出库扣数失败',
        message: '请检查数量、权限和后端服务状态。',
        id: 'cold-storage-outbound-error'
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const submitTransfer = async () => {
    if (!selectedOutboundItem) {
      setTransferError('请先从库存卡片选择要改库位的批次。');
      return;
    }

    if (!transferForm.location) {
      setTransferError('请选择新库位。');
      return;
    }

    const quantity = effectiveTransferQuantity;

    if (quantity === null || quantity <= 0) {
      setTransferError('移动数量必须大于 0；留空时会按当前整批库存移动。');
      return;
    }

    if (selectedStockQuantity !== null && quantity > selectedStockQuantity) {
      setTransferError('移动数量不能大于当前库存。');
      return;
    }

    setSubmittingAction(true);
    setTransferError(undefined);

    try {
      await api.post(apiUrl(ApiEndpoints.stock_transfer), {
        items: [buildStockAdjustmentItem(selectedOutboundItem, quantity)],
        location: Number(transferForm.location),
        notes: buildTransferNotes({
          item: selectedOutboundItem,
          form: transferForm,
          quantity,
          locationName: selectedTransferLocation?.label ?? transferForm.location
        })
      });

      notifications.show({
        title: '改库位完成',
        message: `${getPartName(selectedOutboundItem)} 已移动到 ${selectedTransferLocation?.label ?? '新库位'}。`,
        color: 'green'
      });

      setOpenedDraft(null);
      setSelectedOutboundItem(null);
      setTransferForm(createTransferForm());
      refreshStock();
    } catch (error: any) {
      setTransferError('改库位失败，请检查库位、数量、权限和后端服务状态。');
      showApiErrorMessage({
        error,
        title: '改库位失败',
        message: '请检查库位、数量、权限和后端服务状态。',
        id: 'cold-storage-transfer-error'
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const submitCount = async () => {
    if (!selectedOutboundItem) {
      setCountError('请先从库存卡片选择要盘点的批次。');
      return;
    }

    const quantity = toNumber(countForm.quantity);

    if (quantity === null || quantity < 0) {
      setCountError('实际数量不能小于 0。');
      return;
    }

    if (!countForm.reason) {
      setCountError('请选择差异原因。');
      return;
    }

    setSubmittingAction(true);
    setCountError(undefined);

    try {
      await api.post(apiUrl(ApiEndpoints.stock_count), {
        items: [buildStockAdjustmentItem(selectedOutboundItem, quantity)],
        notes: buildCountNotes({
          item: selectedOutboundItem,
          form: countForm,
          quantity,
          stockQuantity: selectedStockQuantity
        })
      });

      notifications.show({
        title: '盘点改数完成',
        message: `${getPartName(selectedOutboundItem)} 已同步为 ${displayNumber(quantity)}。`,
        color: 'green'
      });

      setOpenedDraft(null);
      setSelectedOutboundItem(null);
      setCountForm(createCountForm(null));
      refreshStock();
    } catch (error: any) {
      setCountError('盘点改数失败，请检查数量、权限和后端服务状态。');
      showApiErrorMessage({
        error,
        title: '盘点改数失败',
        message: '请检查数量、权限和后端服务状态。',
        id: 'cold-storage-count-error'
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const submitWaste = async () => {
    if (!selectedOutboundItem) {
      setWasteError('请先从库存卡片选择要报损的批次。');
      return;
    }

    const quantity = toNumber(wasteForm.quantity);

    if (quantity === null || quantity <= 0) {
      setWasteError('报损数量必须大于 0。');
      return;
    }

    if (selectedStockQuantity !== null && quantity > selectedStockQuantity) {
      setWasteError('报损数量不能大于当前库存。');
      return;
    }

    if (!wasteForm.reason) {
      setWasteError('请选择报损/过期原因。');
      return;
    }

    setSubmittingAction(true);
    setWasteError(undefined);

    try {
      await api.post(apiUrl(ApiEndpoints.stock_remove), {
        items: [buildStockAdjustmentItem(selectedOutboundItem, quantity)],
        notes: buildWasteNotes({
          item: selectedOutboundItem,
          form: wasteForm,
          quantity
        })
      });

      notifications.show({
        title: '报损/过期完成',
        message: `${getPartName(selectedOutboundItem)} 已扣减 ${displayNumber(quantity)}。`,
        color: 'green'
      });

      setOpenedDraft(null);
      setSelectedOutboundItem(null);
      setWasteForm(createWasteForm());
      refreshStock();
    } catch (error: any) {
      setWasteError('报损/过期失败，请检查数量、权限和后端服务状态。');
      showApiErrorMessage({
        error,
        title: '报损/过期失败',
        message: '请检查数量、权限和后端服务状态。',
        id: 'cold-storage-waste-error'
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <>
      <PageTitle title='冷库工作台' />
      {createStock.modal}
      <Modal
        opened={!!draft}
        onClose={closeDraft}
        title={draft?.title}
        size='lg'
      >
        {draft && openedDraft === 'outbound' && selectedOutboundItem ? (
          <Stack gap='md'>
            <Alert color='orange' icon={<IconInfoCircle />}>
              {draft.warning}
            </Alert>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
              <TextInput
                label='货品'
                value={getPartName(selectedOutboundItem)}
                readOnly
              />
              <TextInput
                label='批次号'
                value={displayText(selectedOutboundItem.batch, '无批次号')}
                readOnly
              />
              <TextInput
                label='出库库位'
                value={getLocationName(selectedOutboundItem)}
                readOnly
              />
              <TextInput
                label='当前库存'
                value={displayStockQuantity(selectedOutboundItem)}
                readOnly
              />
              <TextInput
                label='客户/去向'
                placeholder='输入客户、门店或临时去向'
                value={outboundForm.customer}
                onChange={(event) =>
                  setOutboundForm((form) => ({
                    ...form,
                    customer: event.currentTarget.value
                  }))
                }
                required
              />
              <NumberInput
                label='出库数量'
                placeholder='输入本次扣减数量'
                value={outboundForm.quantity}
                min={0}
                max={selectedStockQuantity ?? undefined}
                onChange={(value) =>
                  setOutboundForm((form) => ({ ...form, quantity: value }))
                }
                required
              />
              <NumberInput
                label='单价'
                placeholder='可选，写入库存流水备注'
                value={outboundForm.unitPrice}
                min={0}
                onChange={(value) =>
                  setOutboundForm((form) => ({ ...form, unitPrice: value }))
                }
              />
              <TextInput
                label='总价'
                value={displayNumber(outboundTotal, 2)}
                placeholder='按出库数量 x 单价自动计算'
                readOnly
              />
              <TextInput
                label='出库日期'
                type='date'
                value={outboundForm.outboundDate}
                onChange={(event) =>
                  setOutboundForm((form) => ({
                    ...form,
                    outboundDate: event.currentTarget.value
                  }))
                }
              />
            </SimpleGrid>

            <Textarea
              label='备注'
              placeholder='司机、车牌、纸质单号、临时说明等'
              value={outboundForm.notes}
              onChange={(event) =>
                setOutboundForm((form) => ({
                  ...form,
                  notes: event.currentTarget.value
                }))
              }
              minRows={3}
            />

            {outboundError && (
              <Alert color='red' icon={<IconInfoCircle />}>
                {outboundError}
              </Alert>
            )}

            <Group justify='flex-end'>
              <Button
                variant='default'
                onClick={closeDraft}
                disabled={submittingAction}
              >
                关闭
              </Button>
              <Button
                color='orange'
                loading={submittingAction}
                onClick={submitOutbound}
              >
                {draft.submitLabel}
              </Button>
            </Group>
          </Stack>
        ) : draft && openedDraft === 'transfer' && selectedOutboundItem ? (
          <Stack gap='md'>
            <Alert color='violet' icon={<IconInfoCircle />}>
              该表单会真实移动所选库存批次。移动数量留空时，按当前整批库存移动。
            </Alert>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
              <TextInput
                label='货品'
                value={getPartName(selectedOutboundItem)}
                readOnly
              />
              <TextInput
                label='批次号'
                value={displayText(selectedOutboundItem.batch, '无批次号')}
                readOnly
              />
              <TextInput
                label='原库位'
                value={getLocationName(selectedOutboundItem)}
                readOnly
              />
              <TextInput
                label='当前库存'
                value={displayStockQuantity(selectedOutboundItem)}
                readOnly
              />
              <Select
                label='新库位'
                placeholder='选择目标库位'
                data={locationOptions}
                value={transferForm.location}
                onChange={(value) =>
                  setTransferForm((form) => ({ ...form, location: value }))
                }
                searchable
                disabled={locationsLoading}
                required
              />
              <NumberInput
                label='移动数量'
                placeholder='留空表示整批移动'
                value={transferForm.quantity}
                min={0}
                max={selectedStockQuantity ?? undefined}
                onChange={(value) =>
                  setTransferForm((form) => ({ ...form, quantity: value }))
                }
              />
              <TextInput
                label='移动日期'
                type='date'
                value={transferForm.transferDate}
                onChange={(event) =>
                  setTransferForm((form) => ({
                    ...form,
                    transferDate: event.currentTarget.value
                  }))
                }
              />
              <TextInput
                label='本次移动'
                value={
                  effectiveTransferQuantity === null
                    ? ''
                    : displayNumber(effectiveTransferQuantity)
                }
                placeholder='按移动数量或当前库存自动计算'
                readOnly
              />
            </SimpleGrid>

            <Textarea
              label='备注'
              placeholder='临时腾库、串库整理等情况'
              value={transferForm.notes}
              onChange={(event) =>
                setTransferForm((form) => ({
                  ...form,
                  notes: event.currentTarget.value
                }))
              }
              minRows={3}
            />

            {(transferError || locationsError) && (
              <Alert color='red' icon={<IconInfoCircle />}>
                {transferError || locationsError}
              </Alert>
            )}

            <Group justify='flex-end'>
              <Button
                variant='default'
                onClick={closeDraft}
                disabled={submittingAction}
              >
                关闭
              </Button>
              <Button
                color='violet'
                loading={submittingAction}
                onClick={submitTransfer}
              >
                确认改库位
              </Button>
            </Group>
          </Stack>
        ) : draft && openedDraft === 'count' && selectedOutboundItem ? (
          <Stack gap='md'>
            <Alert color='grape' icon={<IconInfoCircle />}>
              该表单会把所选库存批次同步为现场实际数量，并写入库存流水备注。
            </Alert>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
              <TextInput
                label='货品'
                value={getPartName(selectedOutboundItem)}
                readOnly
              />
              <TextInput
                label='批次号'
                value={displayText(selectedOutboundItem.batch, '无批次号')}
                readOnly
              />
              <TextInput
                label='库位'
                value={getLocationName(selectedOutboundItem)}
                readOnly
              />
              <TextInput
                label='账面数量'
                value={displayStockQuantity(selectedOutboundItem)}
                readOnly
              />
              <NumberInput
                label='实际数量'
                placeholder='输入现场清点数量'
                value={countForm.quantity}
                min={0}
                onChange={(value) =>
                  setCountForm((form) => ({ ...form, quantity: value }))
                }
                required
              />
              <TextInput
                label='差异数量'
                value={displayNumber(countDifference)}
                placeholder='实际数量 - 账面数量'
                readOnly
              />
              <Select
                label='差异原因'
                placeholder='选择差异原因'
                data={['少货', '多货', '录错', '损耗', '未知']}
                value={countForm.reason}
                onChange={(value) =>
                  setCountForm((form) => ({ ...form, reason: value }))
                }
                required
              />
              <TextInput
                label='盘点日期'
                type='date'
                value={countForm.countDate}
                onChange={(event) =>
                  setCountForm((form) => ({
                    ...form,
                    countDate: event.currentTarget.value
                  }))
                }
              />
            </SimpleGrid>

            <Textarea
              label='备注'
              placeholder='说明盘点现场情况或后续处理方式'
              value={countForm.notes}
              onChange={(event) =>
                setCountForm((form) => ({
                  ...form,
                  notes: event.currentTarget.value
                }))
              }
              minRows={3}
            />

            {countError && (
              <Alert color='red' icon={<IconInfoCircle />}>
                {countError}
              </Alert>
            )}

            <Group justify='flex-end'>
              <Button
                variant='default'
                onClick={closeDraft}
                disabled={submittingAction}
              >
                关闭
              </Button>
              <Button
                color='grape'
                loading={submittingAction}
                onClick={submitCount}
              >
                确认盘点改数
              </Button>
            </Group>
          </Stack>
        ) : draft && openedDraft === 'waste' && selectedOutboundItem ? (
          <Stack gap='md'>
            <Alert color='red' icon={<IconInfoCircle />}>
              该表单会真实扣减所选库存批次数量，并把报损/过期原因写入库存流水备注。
            </Alert>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
              <TextInput
                label='货品'
                value={getPartName(selectedOutboundItem)}
                readOnly
              />
              <TextInput
                label='批次号'
                value={displayText(selectedOutboundItem.batch, '无批次号')}
                readOnly
              />
              <TextInput
                label='库位'
                value={getLocationName(selectedOutboundItem)}
                readOnly
              />
              <TextInput
                label='当前库存'
                value={displayStockQuantity(selectedOutboundItem)}
                readOnly
              />
              <NumberInput
                label='报损数量'
                placeholder='输入要扣减的报损/过期数量'
                value={wasteForm.quantity}
                min={0}
                max={selectedStockQuantity ?? undefined}
                onChange={(value) =>
                  setWasteForm((form) => ({ ...form, quantity: value }))
                }
                required
              />
              <Select
                label='原因'
                placeholder='选择报损/过期原因'
                data={['过期', '破损', '化冻', '污染', '盘亏', '其他']}
                value={wasteForm.reason}
                onChange={(value) =>
                  setWasteForm((form) => ({ ...form, reason: value }))
                }
                required
              />
              <TextInput
                label='处理日期'
                type='date'
                value={wasteForm.wasteDate}
                onChange={(event) =>
                  setWasteForm((form) => ({
                    ...form,
                    wasteDate: event.currentTarget.value
                  }))
                }
              />
            </SimpleGrid>

            <Textarea
              label='备注'
              placeholder='拍照、主管确认、处理方式等情况'
              value={wasteForm.notes}
              onChange={(event) =>
                setWasteForm((form) => ({
                  ...form,
                  notes: event.currentTarget.value
                }))
              }
              minRows={3}
            />

            {wasteError && (
              <Alert color='red' icon={<IconInfoCircle />}>
                {wasteError}
              </Alert>
            )}

            <Group justify='flex-end'>
              <Button
                variant='default'
                onClick={closeDraft}
                disabled={submittingAction}
              >
                关闭
              </Button>
              <Button
                color='red'
                loading={submittingAction}
                onClick={submitWaste}
              >
                确认报损/过期
              </Button>
            </Group>
          </Stack>
        ) : draft ? (
          <Stack gap='md'>
            <Alert color={draft.color} icon={<IconInfoCircle />}>
              {draft.warning}
            </Alert>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
              {draft.fields
                .filter((field) => field.kind !== 'textarea')
                .map(renderDraftField)}
            </SimpleGrid>
            {draft.fields
              .filter((field) => field.kind === 'textarea')
              .map(renderDraftField)}
            <Group justify='flex-end'>
              <Button variant='default' onClick={() => setOpenedDraft(null)}>
                关闭
              </Button>
              <Button color={draft.color} disabled>
                {draft.submitLabel}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      <Stack gap='lg' p={{ base: 'xs', sm: 'md' }}>
        <Paper withBorder p='lg' radius='md'>
          <Group justify='space-between' align='flex-start' gap='md'>
            <Group gap='md' align='flex-start'>
              <ThemeIcon size={48} radius='md' variant='light' color='teal'>
                <IconBuildingWarehouse size={30} />
              </ThemeIcon>
              <Stack gap={4}>
                <Title order={2}>冷库工作台</Title>
                <Text c='dimmed' size='sm'>
                  给老板和现场人员使用的简化入口。入库、出库、改库位、盘点和报损已经接入真实库存。
                </Text>
              </Stack>
            </Group>
            <Badge color='green' variant='light' size='lg'>
              主流程已接入
            </Badge>
          </Group>
        </Paper>

        <Alert color='blue' icon={<IconInfoCircle />}>
          新货入库会创建真实库存批次；出库扣数、改库位、盘点改数和报损/过期需要先从下方库存卡片选择具体批次。
        </Alert>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
          {actions.map((action) => (
            <Paper key={action.title} withBorder p='md' radius='md'>
              <Stack gap='md' h='100%'>
                <Group justify='space-between' align='flex-start'>
                  <ThemeIcon size={42} radius='md' variant='light' color='teal'>
                    {action.icon}
                  </ThemeIcon>
                  <Badge
                    color={actionStatusColor(action.status)}
                    variant='light'
                  >
                    {actionStatusLabel(action.status)}
                  </Badge>
                </Group>
                <Box>
                  <Title order={3} size='h4'>
                    {action.title}
                  </Title>
                  <Text c='dimmed' size='sm' mt={4}>
                    {action.description}
                  </Text>
                </Box>
                <Button
                  variant='light'
                  color='teal'
                  fullWidth
                  disabled={action.kind !== 'inbound'}
                  mt='auto'
                  onClick={() => {
                    if (action.kind === 'inbound') {
                      createStock.open();
                    }
                  }}
                >
                  {action.buttonLabel}
                </Button>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>

        <Paper withBorder p='md' radius='md'>
          <Stack gap='md'>
            <Group justify='space-between' align='flex-start'>
              <Box>
                <Title order={3}>查库存</Title>
                <Text c='dimmed' size='sm' mt={4}>
                  按现场常用方式显示库存卡片。每张库存卡片对应一个库存批次，可以从卡片进入出库、移库、盘点和报损表单。
                </Text>
              </Box>
              <Badge color='green' variant='light'>
                可操作
              </Badge>
            </Group>
            <ColdStorageStockCards
              refreshSignal={stockRefreshSignal}
              onRemoveStock={openOutbound}
              onTransferStock={openTransfer}
              onCountStock={openCount}
              onWasteStock={openWaste}
            />
          </Stack>
        </Paper>
      </Stack>
    </>
  );
}
