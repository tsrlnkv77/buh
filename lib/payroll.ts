/**
 * Расчёт зарплаты и налогов РК на 2026 год (резидент, трудовой договор).
 * Все ставки и лимиты вынесены в константы — при изменении законодательства
 * достаточно поправить их здесь.
 */

export const MRP_2026 = 4_325
export const MZP_2026 = 85_000

export const RATES = {
  opv: 0.1, // ОПВ — обязательные пенсионные взносы (сотрудник)
  vosms: 0.02, // ВОСМС — взносы на ОСМС (сотрудник)
  ipn: 0.1, // ИПН — базовая ставка
  ipnHigh: 0.15, // ИПН — повышенная ставка с дохода свыше 8 500 МРП в год
  opvr: 0.035, // ОПВР — пенсионные взносы работодателя (2026)
  so: 0.05, // СО — социальные отчисления
  sn: 0.06, // СН — социальный налог (новый НК, без уменьшения на СО)
  oosms: 0.03, // ООСМС — отчисления на ОСМС (работодатель)
} as const

export const LIMITS = {
  opvMax: 50 * MZP_2026,
  opvrMax: 50 * MZP_2026,
  vosmsMax: 20 * MZP_2026,
  oosmsMax: 40 * MZP_2026,
  soMin: MZP_2026,
  soMax: 7 * MZP_2026,
  baseDeduction: 30 * MRP_2026,
  ipnHighThresholdMonthly: (8_500 * MRP_2026) / 12,
} as const

export type PayrollLine = {
  key: string
  label: string
  shortLabel: string
  rate: string
  base: number
  amount: number
}

export type PayrollResult = {
  gross: number
  net: number
  employeeLines: PayrollLine[]
  employerLines: PayrollLine[]
  employeeTotal: number
  employerTotal: number
  totalCost: number
}

const round = (value: number) => Math.max(0, Math.round(value))
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function calculatePayroll(gross: number, options: { applyDeduction: boolean }): PayrollResult {
  const salary = Math.max(0, gross)

  const opvBase = Math.min(salary, LIMITS.opvMax)
  const opv = round(opvBase * RATES.opv)

  const vosmsBase = Math.min(salary, LIMITS.vosmsMax)
  const vosms = round(vosmsBase * RATES.vosms)

  const deduction = options.applyDeduction ? LIMITS.baseDeduction : 0
  const ipnBase = round(salary - opv - vosms - deduction)
  const ipnLow = Math.min(ipnBase, LIMITS.ipnHighThresholdMonthly) * RATES.ipn
  const ipnHigh = Math.max(ipnBase - LIMITS.ipnHighThresholdMonthly, 0) * RATES.ipnHigh
  const ipn = round(ipnLow + ipnHigh)

  const opvrBase = Math.min(salary, LIMITS.opvrMax)
  const opvr = round(opvrBase * RATES.opvr)

  const soBase = salary > 0 ? clamp(salary - opv, LIMITS.soMin, LIMITS.soMax) : 0
  const so = round(soBase * RATES.so)

  const snBase = round(salary - opv - vosms)
  const sn = round(snBase * RATES.sn)

  const oosmsBase = Math.min(salary, LIMITS.oosmsMax)
  const oosms = round(oosmsBase * RATES.oosms)

  const employeeLines: PayrollLine[] = [
    { key: 'opv', label: 'Обязательные пенсионные взносы', shortLabel: 'ОПВ', rate: '10%', base: opvBase, amount: opv },
    { key: 'vosms', label: 'Взносы на ОСМС', shortLabel: 'ВОСМС', rate: '2%', base: vosmsBase, amount: vosms },
    {
      key: 'ipn',
      label: 'Индивидуальный подоходный налог',
      shortLabel: 'ИПН',
      rate: ipnBase > LIMITS.ipnHighThresholdMonthly ? '10% / 15%' : '10%',
      base: ipnBase,
      amount: ipn,
    },
  ]

  const employerLines: PayrollLine[] = [
    { key: 'opvr', label: 'Пенсионные взносы работодателя', shortLabel: 'ОПВР', rate: '3,5%', base: opvrBase, amount: opvr },
    { key: 'so', label: 'Социальные отчисления', shortLabel: 'СО', rate: '5%', base: soBase, amount: so },
    { key: 'sn', label: 'Социальный налог', shortLabel: 'СН', rate: '6%', base: snBase, amount: sn },
    { key: 'oosms', label: 'Отчисления на ОСМС', shortLabel: 'ООСМС', rate: '3%', base: oosmsBase, amount: oosms },
  ]

  const employeeTotal = opv + vosms + ipn
  const employerTotal = opvr + so + sn + oosms

  return {
    gross: salary,
    net: Math.max(0, salary - employeeTotal),
    employeeLines,
    employerLines,
    employeeTotal,
    employerTotal,
    totalCost: salary + employerTotal,
  }
}

export const formatTenge = (value: number) =>
  `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value)} тг`
