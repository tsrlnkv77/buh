export const TEMPLATE_FILES = {
  staffing: 'Штатное_расписание_2026.xlsx',
  'payment-calendar': 'Платёжный_календарь_2026.xlsx',
  'month-close': 'Чек-лист_закрытия_месяца.xlsx',
  'demo-osv': 'Демо_ОСВ_для_анализа.xlsx',
} as const

export type TemplateType = keyof typeof TEMPLATE_FILES
