import { TabHero } from '../section'
import { SalaryCalculator } from './salary-calculator'
import { TemplatesList } from './templates-list'

export function ToolsTab() {
  return (
    <div className="stagger flex flex-col gap-5">
      <TabHero
        eyebrow="Инструменты"
        title="Зарплата и налоги 2026"
        description="Мгновенный расчёт удержаний и отчислений плюс готовые Excel-шаблоны."
        image="/illustrations/tools.png"
      />
      <SalaryCalculator />
      <TemplatesList />
    </div>
  )
}
