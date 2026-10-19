/**
 * Экспресс-анализ ОСВ прямо в браузере: файл никуда не отправляется.
 * Ожидаемая структура: «Счёт | Наименование | ... | Сальдо на конец Дт | Сальдо на конец Кт».
 * Конечное сальдо берётся из двух последних числовых колонок.
 */

export type Severity = 'critical' | 'warning' | 'info'

export type Finding = {
  id: string
  severity: Severity
  account: string
  title: string
  description: string
  recommendation: string
}

export type AnalysisResult = {
  fileName: string
  sheetName: string
  accountsFound: number
  findings: Finding[]
  isSample: boolean
}

const CASH_ACCOUNTS = new Set(['1010', '1020', '1030', '1040', '1050'])
const ACCOUNTABLE_ACCOUNTS = new Set(['1250', '1251', '1252'])

type AccountRow = { code: string; name: string; values: Map<number, number> }

function toPrimitive(value: unknown): string | number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value instanceof Date) return null
  if (typeof value === 'object') {
    const obj = value as { result?: unknown; richText?: { text: string }[]; text?: string }
    if (obj.result !== undefined) return toPrimitive(obj.result)
    if (obj.richText) return obj.richText.map((part) => part.text).join('')
    if (typeof obj.text === 'string') return obj.text
  }
  return null
}

function parseNumber(value: string | number | null): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const cleaned = value.replace(/[\s\u00a0]/g, '').replace(',', '.')
  if (!/^[-−]?\(?\d+(\.\d+)?\)?$/.test(cleaned)) return null
  const negative = cleaned.startsWith('-') || cleaned.startsWith('−') || cleaned.startsWith('(')
  const num = Number(cleaned.replace(/[-−()]/g, ''))
  return negative ? -num : num
}

const money = (value: number) => `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)} тг`

export async function analyzeOsvFile(file: File): Promise<AnalysisResult> {
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())

  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('В файле нет листов')

  const rows: AccountRow[] = []
  let maxNumericCol = 0

  sheet.eachRow((row) => {
    const cells: (string | number | null)[] = []
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cells[col] = toPrimitive(cell.value)
    })

    const codeCol = [1, 2].find((col) => /^\d{4}$/.test(String(cells[col] ?? '').trim()))
    if (!codeCol) return

    const code = String(cells[codeCol]).trim()
    const name = cells.find((cell, col) => col > codeCol && typeof cell === 'string' && parseNumber(cell) === null)
    const values = new Map<number, number>()
    cells.forEach((cell, col) => {
      if (col <= codeCol) return
      const num = parseNumber(cell)
      if (num !== null) {
        values.set(col, num)
        maxNumericCol = Math.max(maxNumericCol, col)
      }
    })
    rows.push({ code, name: typeof name === 'string' ? name : '', values })
  })

  const findings: Finding[] = []
  const add = (finding: Omit<Finding, 'id'>) =>
    findings.push({ ...finding, id: `${finding.account}-${findings.length}` })

  for (const { code, name, values } of rows) {
    const label = name ? `${code} «${name}»` : code
    const closingDebit = values.get(maxNumericCol - 1) ?? 0
    const closingCredit = values.get(maxNumericCol) ?? 0
    const negative = [...values.values()].find((v) => v < 0)

    if (negative !== undefined) {
      add({
        severity: 'critical',
        account: code,
        title: `Счёт ${code}: Отрицательное сальдо`,
        description: `По счёту ${label} обнаружена отрицательная сумма ${money(negative)}. Остаток не может быть меньше нуля.`,
        recommendation: 'Проверьте даты проводок и первичные документы: возможно, расход отражён раньше поступления.',
      })
    }

    if (CASH_ACCOUNTS.has(code) && closingCredit > 0) {
      add({
        severity: 'critical',
        account: code,
        title: `Счёт ${code}: Кредитовое сальдо по денежному счёту`,
        description: `Активный счёт ${label} имеет кредитовое сальдо ${money(closingCredit)} на конец периода.`,
        recommendation: 'Сверьте выписку банка / кассовую книгу с учётом и найдите незарегистрированные поступления.',
      })
    }

    if (ACCOUNTABLE_ACCOUNTS.has(code) && closingDebit > 0) {
      add({
        severity: 'warning',
        account: code,
        title: `Подотчёт ${code} не закрыт`,
        description: `Дебетовое сальдо ${money(closingDebit)} — подотчётные суммы не возвращены или не подтверждены авансовым отчётом.`,
        recommendation: 'Запросите авансовые отчёты у подотчётных лиц или оформите удержание/возврат.',
      })
    }

    if (code === '3350' && closingCredit > 0) {
      add({
        severity: 'info',
        account: code,
        title: 'Счёт 3350: Задолженность по оплате труда',
        description: `Невыплаченная зарплата на конец периода: ${money(closingCredit)}.`,
        recommendation: 'Убедитесь, что выплата произойдёт в сроки, установленные трудовым договором.',
      })
    }

    if (/^31[1-9]\d$/.test(code) && closingDebit > 0) {
      add({
        severity: 'info',
        account: code,
        title: `Счёт ${code}: Переплата по налогам`,
        description: `Дебетовое сальдо ${money(closingDebit)} — возможна переплата или ошибка в начислении.`,
        recommendation: 'Сверьтесь с лицевым счётом в кабинете налогоплательщика (КНП).',
      })
    }

    const isBalanceAccount = /^[1-5]/.test(code) && !CASH_ACCOUNTS.has(code)
    if (isBalanceAccount && closingDebit > 0 && closingCredit > 0 && !/^(12|33)/.test(code)) {
      add({
        severity: 'info',
        account: code,
        title: `Счёт ${code}: Развёрнутое сальдо`,
        description: `Одновременно Дт ${money(closingDebit)} и Кт ${money(closingCredit)} по счёту ${label}.`,
        recommendation: 'Проверьте аналитику и проведите взаимозачёт, если это одна и та же позиция.',
      })
    }
  }

  const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2 }
  findings.sort((a, b) => order[a.severity] - order[b.severity])

  return {
    fileName: file.name,
    sheetName: sheet.name,
    accountsFound: rows.length,
    findings,
    isSample: false,
  }
}

export const SAMPLE_RESULT: AnalysisResult = {
  fileName: 'ОСВ_сентябрь_2026.xlsx',
  sheetName: 'ОСВ',
  accountsFound: 42,
  isSample: true,
  findings: [
    {
      id: 's1',
      severity: 'critical',
      account: '1010',
      title: 'Счёт 1010: Отрицательное сальдо',
      description: 'Остаток наличных в кассе на конец периода: −45 000 тг. Касса не может уйти в минус.',
      recommendation: 'Проверьте порядок ПКО/РКО за последние дни месяца и даты оприходования выручки.',
    },
    {
      id: 's2',
      severity: 'warning',
      account: '1251',
      title: 'Подотчёт 1251 не закрыт',
      description: 'Дебетовое сальдо 120 000 тг — авансовые отчёты не предоставлены более 30 дней.',
      recommendation: 'Запросите авансовые отчёты или удержите сумму из заработной платы с согласия работника.',
    },
    {
      id: 's3',
      severity: 'info',
      account: '3350',
      title: 'Счёт 3350: Задолженность по оплате труда',
      description: 'Невыплаченная зарплата на конец периода: 1 840 000 тг.',
      recommendation: 'Убедитесь, что выплата произойдёт в сроки, установленные трудовым договором.',
    },
  ],
}
