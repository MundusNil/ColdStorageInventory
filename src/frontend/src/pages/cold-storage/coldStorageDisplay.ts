export type ColdStorageDisplayRecord = {
  quantity?: number | string;
  status_text?: string;
  status_custom_key?: string;
  part_detail?: {
    units?: string;
  };
};

const unitLabels: Record<string, string> = {
  bag: '袋',
  bags: '袋',
  box: '箱',
  boxes: '箱',
  carton: '箱',
  cartons: '箱',
  g: '克',
  gram: '克',
  grams: '克',
  kg: '千克',
  kilogram: '千克',
  kilograms: '千克',
  pack: '包',
  package: '包',
  packages: '包',
  pcs: '件',
  piece: '件',
  pieces: '件',
  unit: '件',
  units: '件'
};

const stockStatusLabels: Record<string, string> = {
  allocated: '已分配',
  available: '正常',
  damaged: '破损',
  destroyed: '已报损',
  expired: '已过期',
  in_stock: '有库存',
  lost: '丢失',
  normal: '正常',
  ok: '正常',
  on_hold: '冻结',
  quarantine: '冻结',
  quarantined: '冻结',
  rejected: '已拒收',
  reserved: '已预留'
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function displayText(value: unknown, fallback = '-') {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback;
}

export function displayUnit(value?: string) {
  const raw = displayText(value, '');

  if (!raw) {
    return '';
  }

  return unitLabels[normalizeKey(raw)] ?? raw;
}

export function displayStockQuantity(record: ColdStorageDisplayRecord) {
  const quantity = record.quantity ?? '-';
  const units = displayUnit(record.part_detail?.units);
  const amount =
    typeof quantity === 'number' ? quantity.toLocaleString('zh-CN') : quantity;

  return `${amount}${units ? ` ${units}` : ''}`;
}

export function displayStockStatus(record: ColdStorageDisplayRecord) {
  const rawStatus = displayText(
    record.status_text || record.status_custom_key,
    '正常'
  );

  return stockStatusLabels[normalizeKey(rawStatus)] ?? rawStatus;
}
