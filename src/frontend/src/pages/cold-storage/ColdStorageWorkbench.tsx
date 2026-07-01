import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title
} from '@mantine/core';
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
import { ApiEndpoints } from '@lib/enums/ApiEndpoints';
import { ModelType } from '@lib/enums/ModelType';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import PageTitle from '../../components/nav/PageTitle';
import {
  useRemoveStockItem,
  useStockFields
} from '../../forms/StockForms';
import { useCreateApiFormModal } from '../../hooks/UseForm';
import ColdStorageStockCards, {
  type ColdStorageStockRecord
} from './ColdStorageStockCards';

type DraftAction = 'transfer' | 'count' | 'waste';

type WorkbenchActionKind =
  | 'inbound'
  | 'outbound'
  | 'search'
  | DraftAction;

type FieldKind = 'text' | 'number' | 'date' | 'textarea';

type DraftField = {
  label: string;
  placeholder?: string;
  kind?: FieldKind;
};

type WorkbenchActionStatus = 'enabled' | 'draft' | 'readonly';

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

const actions: WorkbenchAction[] = [
  {
    title: '新货入库',
    description: '登记新到货品、数量、批次、库位和到期日期。',
    status: 'enabled',
    icon: <IconPackageImport />,
    buttonLabel: '新增库存',
    kind: 'inbound'
  },
  {
    title: '出库扣数',
    description: '先在下方库存卡片找到批次，再从卡片里扣减数量。',
    status: 'enabled',
    icon: <IconPackageExport />,
    buttonLabel: '去下方选择批次',
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
    description: '把货品从一个库位转到另一个库位。',
    status: 'draft',
    icon: <IconArrowsExchange />,
    buttonLabel: '填写草稿',
    kind: 'transfer'
  },
  {
    title: '盘点改数',
    description: '录入实际数量，保留差异记录。',
    status: 'draft',
    icon: <IconClipboardCheck />,
    buttonLabel: '填写草稿',
    kind: 'count'
  },
  {
    title: '报损/过期',
    description: '登记过期、破损、变质或盘亏数量。',
    status: 'draft',
    icon: <IconTrash />,
    buttonLabel: '填写草稿',
    kind: 'waste'
  }
];

const draftDialogs: Record<DraftAction, DraftDialog> = {
  transfer: {
    title: '改库位草稿',
    warning:
      '这里只是库位调整的字段草稿，当前不会移动库存。库位命名和移库复核规则确认后再启用。',
    color: 'violet',
    submitLabel: '流程确认后启用移库',
    fields: [
      { label: '货品名称', placeholder: '手动输入要移库的货品' },
      { label: '批次', placeholder: '选择要移动的库存批次' },
      { label: '原冷库/库位', placeholder: '例如：北-架子下-东' },
      { label: '新冷库/库位', placeholder: '例如：南-西' },
      { label: '移动数量', placeholder: '不填表示整批移动', kind: 'number' },
      { label: '单位', placeholder: '箱 / 件 / 袋 / 千克' },
      { label: '移动日期', kind: 'date' },
      { label: '经手人', placeholder: '现场登记人' },
      {
        label: '备注',
        placeholder: '临时腾库、串库整理等情况',
        kind: 'textarea'
      }
    ]
  },
  count: {
    title: '盘点改数草稿',
    warning:
      '这里只是盘点记录的字段草稿，当前不会覆盖库存数量。差异处理和复核规则确认后再接真实接口。',
    color: 'grape',
    submitLabel: '流程确认后启用改数',
    fields: [
      { label: '货品名称', placeholder: '手动输入盘点货品' },
      { label: '冷库/库位', placeholder: '例如：北-架子下-东' },
      { label: '批次', placeholder: '选择盘点批次' },
      { label: '系统数量', placeholder: '盘点前账面数量', kind: 'number' },
      { label: '实际数量', placeholder: '现场清点数量', kind: 'number' },
      { label: '单位', placeholder: '箱 / 件 / 袋 / 千克' },
      { label: '盘点日期', kind: 'date' },
      { label: '盘点人', placeholder: '现场盘点人' },
      {
        label: '差异原因',
        placeholder: '少货、多货、记录错误、破包等情况',
        kind: 'textarea'
      }
    ]
  },
  waste: {
    title: '报损/过期草稿',
    warning:
      '这里只是报损和过期处理的字段草稿，当前不会扣减库存。责任归类和审批规则确认后再接真实保存。',
    color: 'red',
    submitLabel: '流程确认后启用报损',
    fields: [
      { label: '货品名称', placeholder: '手动输入报损货品' },
      { label: '冷库/库位', placeholder: '例如：北-架子下-东' },
      { label: '批次', placeholder: '选择报损批次' },
      { label: '报损数量', placeholder: '输入数量', kind: 'number' },
      { label: '单位', placeholder: '箱 / 件 / 袋 / 千克' },
      { label: '原因', placeholder: '过期 / 破损 / 变质 / 盘亏' },
      { label: '处理日期', kind: 'date' },
      { label: '经手人', placeholder: '现场登记人' },
      {
        label: '备注',
        placeholder: '拍照、主管确认、处理方式等情况',
        kind: 'textarea'
      }
    ]
  }
};

function actionStatusColor(status: WorkbenchActionStatus) {
  if (status === 'enabled') {
    return 'green';
  }

  if (status === 'draft') {
    return 'blue';
  }

  return 'gray';
}

function actionStatusLabel(status: WorkbenchActionStatus) {
  if (status === 'enabled') {
    return '已启用';
  }

  if (status === 'draft') {
    return '表单草稿';
  }

  return '只读';
}

function renderDraftField(field: DraftField) {
  if (field.kind === 'textarea') {
    return (
      <Textarea
        key={field.label}
        label={field.label}
        placeholder={field.placeholder}
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
        min={0}
      />
    );
  }

  return (
    <TextInput
      key={field.label}
      label={field.label}
      placeholder={field.placeholder}
      type={field.kind === 'date' ? 'date' : 'text'}
    />
  );
}

export default function ColdStorageWorkbench() {
  const [openedDraft, setOpenedDraft] = useState<DraftAction | null>(null);
  const [stockRefreshSignal, setStockRefreshSignal] = useState(0);
  const [selectedOutboundItem, setSelectedOutboundItem] =
    useState<ColdStorageStockRecord | null>(null);
  const [outboundOpenSignal, setOutboundOpenSignal] = useState(0);
  const lastOpenedOutboundSignal = useRef(0);

  const refreshStock = () => setStockRefreshSignal((value) => value + 1);

  const stockFields = useStockFields({
    create: true,
    modalId: 'cold-storage-create-stock-item'
  });

  const inboundFields = useMemo(() => {
    const fields = { ...stockFields };

    fields.part = {
      ...fields.part,
      label: '货品',
      description: '选择要入库的货品'
    };

    fields.location = {
      ...fields.location,
      label: '库位',
      description: '选择本批货存放位置'
    };

    fields.quantity = {
      ...fields.quantity,
      label: '数量',
      description: '输入本批入库数量'
    };

    fields.batch = {
      ...fields.batch,
      label: '批次',
      description: '可手动填写，也可以留空使用系统建议值'
    };

    if (fields.expiry_date) {
      fields.expiry_date = {
        ...fields.expiry_date,
        label: '到期日期'
      };
    }

    fields.purchase_price = {
      ...fields.purchase_price,
      label: '进价'
    };

    fields.purchase_price_currency = {
      ...fields.purchase_price_currency,
      label: '进价币种',
      description: '选择本批货进价使用的货币'
    };

    fields.packaging = {
      ...fields.packaging,
      label: '包装/单位说明',
      description: '例如：箱、袋、件、千克'
    };

    if (fields.supplier_part) fields.supplier_part.hidden = true;
    if (fields.use_pack_size) fields.use_pack_size.hidden = true;
    if (fields.serial_numbers) fields.serial_numbers.hidden = true;
    if (fields.status_custom_key) fields.status_custom_key.hidden = true;
    if (fields.tags) fields.tags.hidden = true;
    if (fields.link) fields.link.hidden = true;
    if (fields.owner) fields.owner.hidden = true;
    if (fields.delete_on_deplete) fields.delete_on_deplete.hidden = true;

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
    onFormSuccess: refreshStock
  });

  const outboundItems = useMemo(() => {
    return selectedOutboundItem ? [selectedOutboundItem] : [];
  }, [selectedOutboundItem]);

  const removeStock = useRemoveStockItem({
    items: outboundItems,
    model: ModelType.stockitem,
    refresh: refreshStock
  });

  const draft = openedDraft ? draftDialogs[openedDraft] : null;

  const openOutbound = (item: ColdStorageStockRecord) => {
    setSelectedOutboundItem(item);
    setOutboundOpenSignal((value) => value + 1);
  };

  useEffect(() => {
    if (
      outboundOpenSignal > 0 &&
      selectedOutboundItem &&
      outboundOpenSignal !== lastOpenedOutboundSignal.current
    ) {
      lastOpenedOutboundSignal.current = outboundOpenSignal;
      removeStock.open();
    }
  }, [outboundOpenSignal, selectedOutboundItem, removeStock]);

  return (
    <>
      <PageTitle title='冷库工作台' />
      {createStock.modal}
      {removeStock.modal}
      <Modal
        opened={!!draft}
        onClose={() => setOpenedDraft(null)}
        title={draft?.title}
        size='lg'
      >
        {draft && (
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
        )}
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
                  给老板和现场人员使用的简化入口。当前已接入真实入库和出库扣数，盘点、报损、改库位仍先保留为草稿。
                </Text>
              </Stack>
            </Group>
            <Badge color='green' variant='light' size='lg'>
              主流程已启用
            </Badge>
          </Group>
        </Paper>

        <Alert color='blue' icon={<IconInfoCircle />}>
          新货入库会创建真实库存批次；出库扣数会修改选中批次的库存数量。请先用测试货品验证流程，再录入正式数据。
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
                  disabled={action.kind === 'search' || action.kind === 'outbound'}
                  mt='auto'
                  onClick={() => {
                    if (action.kind === 'inbound') {
                      createStock.open();
                    } else if (
                      action.kind === 'transfer' ||
                      action.kind === 'count' ||
                      action.kind === 'waste'
                    ) {
                      setOpenedDraft(action.kind);
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
                  按现场常用方式显示库存卡片。每张库存卡片都对应一个真实库存批次，可以从卡片上执行出库扣数。
                </Text>
              </Box>
              <Badge color='green' variant='light'>
                可操作
              </Badge>
            </Group>
            <ColdStorageStockCards
              refreshSignal={stockRefreshSignal}
              onRemoveStock={openOutbound}
            />
          </Stack>
        </Paper>
      </Stack>
    </>
  );
}
