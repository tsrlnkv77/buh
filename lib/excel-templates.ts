import ExcelJS from 'exceljs'
import type { TemplateType } from './excel-templates-meta'

export { TEMPLATE_FILES, type TemplateType } from './excel-templates-meta'

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2481CC' } }
const TOTAL_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF2FA' } }
const MONEY = '#,##0 "₸"'

function addTitle(sheet: ExcelJS.Worksheet, title: string, columns: number) {
  sheet.mergeCells(1, 1, 1, columns)
  const cell = sheet.getCell(1, 1)
  cell.value = title
  cell.font = { bold: true, size: 14 }
  sheet.getRow(1).height = 24
  sheet.addRow([])
}

function addHeader(sheet: ExcelJS.Worksheet, headers: string[]) {
  const row = sheet.addRow(headers)
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  row.height = 32
  return row.number
}

function borderAll(sheet: ExcelJS.Worksheet, fromRow: number, toRow: number, cols: number) {
  for (let r = fromRow; r <= toRow; r++) {
    for (let c = 1; c <= cols; c++) {
      sheet.getCell(r, c).border = {
        top: { style: 'thin', color: { argb: 'FFD0D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD0D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD0D5DB' } },
      }
    }
  }
}

function buildStaffing(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Штатное расписание')
  sheet.columns = [{ width: 5 }, { width: 24 }, { width: 28 }, { width: 12 }, { width: 16 }, { width: 14 }, { width: 18 }, { width: 22 }]
  addTitle(sheet, 'Штатное расписание на 2026 год (МЗП 85 000 ₸)', 8)
  const header = addHeader(sheet, ['№', 'Подразделение', 'Должность', 'Кол-во ед.', 'Оклад', 'Надбавка', 'ФОТ в месяц', 'Примечание'])

  const rows: [string, string, number, number, number][] = [
    ['Администрация', 'Директор', 1, 900_000, 0],
    ['Бухгалтерия', 'Главный бухгалтер', 1, 650_000, 50_000],
    ['Бухгалтерия', 'Бухгалтер', 2, 380_000, 0],
    ['Отдел продаж', 'Менеджер по продажам', 3, 320_000, 30_000],
    ['Склад', 'Кладовщик', 1, 250_000, 0],
  ]
  rows.forEach(([dept, position, qty, salary, bonus], i) => {
    const row = sheet.addRow([i + 1, dept, position, qty, salary, bonus])
    row.getCell(7).value = { formula: `D${row.number}*(E${row.number}+F${row.number})` }
  })
  const first = header + 1
  const last = sheet.lastRow!.number
  const total = sheet.addRow(['', 'ИТОГО', '', { formula: `SUM(D${first}:D${last})` }, '', '', { formula: `SUM(G${first}:G${last})` }])
  total.font = { bold: true }
  total.eachCell((cell) => (cell.fill = TOTAL_FILL))

  ;['E', 'F', 'G'].forEach((col) => (sheet.getColumn(col).numFmt = MONEY))
  borderAll(sheet, header, total.number, 8)
  sheet.views = [{ state: 'frozen', ySplit: header }]
}

function buildPaymentCalendar(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Платёжный календарь')
  sheet.columns = [{ width: 12 }, { width: 34 }, { width: 22 }, { width: 16 }, { width: 16 }, { width: 18 }]
  addTitle(sheet, 'Платёжный календарь — октябрь 2026', 6)
  const header = addHeader(sheet, ['Дата', 'Статья', 'Контрагент', 'Поступления', 'Выплаты', 'Остаток'])

  const opening = sheet.addRow(['01.10.2026', 'Остаток на начало периода', '', '', '', 5_000_000])
  opening.font = { bold: true }

  const items: [string, string, string, number, number][] = [
    ['05.10.2026', 'Оплата от покупателя', 'Покупатель А', 3_200_000, 0],
    ['10.10.2026', 'Аренда офиса', 'Арендодатель', 0, 450_000],
    ['10.10.2026', 'Зарплата за сентябрь', 'Сотрудники', 0, 2_150_000],
    ['15.10.2026', 'Оплата поставщику', 'Поставщик Б', 0, 1_100_000],
    ['25.10.2026', 'ИПН, СН, СО, ОПВ, ОПВР, ОСМС за сентябрь', 'Бюджет / ЕНПФ / ФСМС', 0, 980_000],
    ['25.10.2026', 'НДС за III квартал', 'Бюджет', 0, 620_000],
    ['28.10.2026', 'Оплата от покупателя', 'Покупатель В', 1_750_000, 0],
  ]
  items.forEach((item) => {
    const row = sheet.addRow(item)
    row.getCell(6).value = { formula: `F${row.number - 1}+D${row.number}-E${row.number}` }
  })
  const first = header + 2
  const last = sheet.lastRow!.number
  const total = sheet.addRow([
    '',
    'ИТОГО за период',
    '',
    { formula: `SUM(D${first}:D${last})` },
    { formula: `SUM(E${first}:E${last})` },
    { formula: `F${last}` },
  ])
  total.font = { bold: true }
  total.eachCell((cell) => (cell.fill = TOTAL_FILL))

  ;['D', 'E', 'F'].forEach((col) => (sheet.getColumn(col).numFmt = MONEY))
  borderAll(sheet, header, total.number, 6)
  sheet.views = [{ state: 'frozen', ySplit: header }]
}

function buildMonthClose(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Закрытие месяца')
  sheet.columns = [{ width: 5 }, { width: 48 }, { width: 14 }, { width: 18 }, { width: 12 }, { width: 14 }, { width: 28 }]
  addTitle(sheet, 'Чек-лист закрытия месяца', 7)
  const header = addHeader(sheet, ['№', 'Задача', 'Счета', 'Ответственный', 'Срок', 'Статус', 'Комментарий'])

  const tasks: [string, string, string][] = [
    ['Загрузить и разнести банковские выписки', '1030', 'до 3 числа'],
    ['Сверить кассу с кассовой книгой', '1010', 'до 3 числа'],
    ['Проверить и принять авансовые отчёты', '1251', 'до 5 числа'],
    ['Оприходовать поступления ТМЗ и услуг', '1310, 3310', 'до 5 числа'],
    ['Принять входящие ЭСФ в ИС ЭСФ', '1420', 'до 5 числа'],
    ['Выписать исходящие ЭСФ (15 календарных дней)', '3130', 'до 15 числа'],
    ['Подтвердить/закрыть СНТ', '1310', 'до 5 числа'],
    ['Начислить амортизацию ОС и НМА', '2420, 2740', 'до 5 числа'],
    ['Начислить зарплату и налоги (ИПН, СН, СО, ОПВ, ОПВР, ОСМС)', '3350, 3120, 3150', 'до 5 числа'],
    ['Списать расходы будущих периодов', '1620', 'до 5 числа'],
    ['Провести курсовую переоценку', '6250, 7430', 'до 5 числа'],
    ['Сверить расчёты с ключевыми контрагентами', '1210, 3310', 'до 7 числа'],
    ['Проверить ОСВ на отрицательные и развёрнутые сальдо', 'Все', 'до 7 числа'],
    ['Перечислить налоги и взносы с зарплаты', '3120, 3150, 3210–3230', 'до 25 числа'],
    ['Закрыть счета доходов и расходов (в конце года)', '6000, 7000, 5610', 'до 10 января'],
  ]
  const first = header + 1
  tasks.forEach(([task, accounts, due], i) => sheet.addRow([i + 1, task, accounts, '', due, 'Не начато', '']))
  const last = sheet.lastRow!.number

  for (let r = first; r <= last; r++) {
    sheet.getCell(r, 6).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"Не начато,В работе,Готово"'],
    }
    sheet.getCell(r, 2).alignment = { wrapText: true, vertical: 'middle' }
  }
  sheet.addConditionalFormatting({
    ref: `F${first}:F${last}`,
    rules: [
      {
        type: 'containsText',
        operator: 'containsText',
        text: 'Готово',
        priority: 1,
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFD7F0DD' } } },
      },
    ],
  })
  borderAll(sheet, header, last, 7)
  sheet.views = [{ state: 'frozen', ySplit: header }]
}

function buildDemoOsv(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('ОСВ')
  sheet.columns = [{ width: 8 }, { width: 40 }, ...Array.from({ length: 6 }, () => ({ width: 15 }))]
  addTitle(sheet, 'Оборотно-сальдовая ведомость за сентябрь 2026 (демо, обезличено)', 8)
  const header = addHeader(sheet, ['Счёт', 'Наименование', 'Сальдо нач. Дт', 'Сальдо нач. Кт', 'Обороты Дт', 'Обороты Кт', 'Сальдо кон. Дт', 'Сальдо кон. Кт'])

  const data: (string | number | null)[][] = [
    ['1010', 'Денежные средства в кассе', 80_000, null, 300_000, 425_000, -45_000, null],
    ['1030', 'Денежные средства на текущих счетах', 5_000_000, null, 4_950_000, 5_400_000, 4_550_000, null],
    ['1210', 'Краткосрочная дебиторская задолженность покупателей', 2_300_000, null, 4_100_000, 4_950_000, 1_450_000, null],
    ['1251', 'Краткосрочная задолженность подотчётных лиц', 60_000, null, 150_000, 90_000, 120_000, null],
    ['1310', 'Сырьё и материалы', 1_200_000, null, 800_000, 650_000, 1_350_000, null],
    ['1420', 'НДС к возмещению', 180_000, null, 210_000, 300_000, 90_000, null],
    ['2410', 'Основные средства', 8_500_000, null, 0, 0, 8_500_000, null],
    ['2420', 'Амортизация основных средств', null, 2_100_000, 0, 95_000, null, 2_195_000],
    ['3110', 'КПН к уплате', null, 150_000, 400_000, 0, 250_000, null],
    ['3120', 'ИПН к уплате', null, 190_000, 190_000, 205_000, null, 205_000],
    ['3130', 'НДС к уплате', null, 610_000, 610_000, 620_000, null, 620_000],
    ['3310', 'Задолженность поставщикам', 150_000, 1_800_000, 1_900_000, 1_100_000, 150_000, 1_000_000],
    ['3350', 'Задолженность по оплате труда', null, 1_750_000, 1_750_000, 1_840_000, null, 1_840_000],
    ['5010', 'Уставный капитал', null, 200_000, 0, 0, null, 200_000],
  ]
  data.forEach((row) => sheet.addRow(row))
  for (let col = 3; col <= 8; col++) sheet.getColumn(col).numFmt = '#,##0;[Red]-#,##0'
  borderAll(sheet, header, sheet.lastRow!.number, 8)
  sheet.views = [{ state: 'frozen', ySplit: header }]
}

export async function buildTemplate(type: TemplateType): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Бухгалтер KZ'
  workbook.created = new Date()

  const builders: Record<TemplateType, (wb: ExcelJS.Workbook) => void> = {
    staffing: buildStaffing,
    'payment-calendar': buildPaymentCalendar,
    'month-close': buildMonthClose,
    'demo-osv': buildDemoOsv,
  }
  builders[type](workbook)

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
