"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"

const navigation = [
  { label: "字幕", color: "pink", count: 12 },
  { label: "pdf", color: "green", count: 4 },
  { label: "文本", color: "blue", count: 8 },
  { label: "待定", color: "yellow", count: 3 },
  { label: "待定", color: "mint", count: 2 },
] as const

const sourceRows = [
  "欢迎使用字幕翻译工作台",
  "把每一句话，翻译成更好的表达",
  "选择左侧的文件开始编辑",
  "所有内容都会自动保存",
  "让字幕和文字保持准确",
  "检查时间轴和语言风格",
  "快速预览你的翻译结果",
  "一切准备就绪",
  "今天也要顺利完成工作",
  "保持专注，继续前进",
  "还有几行内容等待处理",
  "完成后即可导出文件",
  "最后检查一次拼写",
  "字幕翻译完成",
]

const translatedRows = [
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
  "01.21",
]

const colorClasses = {
  pink: "bg-[#ffc5c7]",
  green: "bg-[#b6efc0]",
  blue: "bg-[#b8dfff]",
  yellow: "bg-[#ffed9e]",
  mint: "bg-[#98ead1]",
}

export default function Page() {
  const [activeTab, setActiveTab] = useState("字幕")
  const [languageOpen, setLanguageOpen] = useState(false)
  const [language, setLanguage] = useState("语言选择")
  const [selectedRow, setSelectedRow] = useState(0)

  return (
    <main className="min-h-svh bg-[#f4faff] px-3 py-5 text-[#202020] sm:px-8 sm:py-9">
      <section className="workspace relative mx-auto flex min-h-[calc(100svh-2.5rem)] max-w-[998px] flex-col overflow-visible rounded-[29px] border-[2.5px] border-[#202020] bg-[#f5fbff] sm:min-h-[635px] sm:flex-row sm:px-[125px] sm:py-[35px]">
        <nav aria-label="文件类型" className="flex shrink-0 gap-2 px-2 py-4 sm:absolute sm:left-[-2px] sm:top-[163px] sm:flex-col sm:gap-[13px] sm:px-0 sm:py-0">
          {navigation.map((item) => {
            const active = activeTab === item.label
            return (
              <Button
                key={`${item.color}-${item.label}`}
                type="button"
                variant="ghost"
                onClick={() => setActiveTab(item.label)}
                aria-pressed={active}
                className={`h-[43px] min-w-[64px] rounded-[12px] border-[2.5px] border-[#202020] px-2 font-mono text-[22px] font-medium leading-none text-[#202020] shadow-[1px_2px_0_#202020] transition-transform hover:-translate-y-0.5 hover:bg-inherit sm:h-[45px] sm:min-w-[67px] ${colorClasses[item.color]} ${active ? "-translate-x-1" : ""}`}
              >
                {item.label}
                <span className="sr-only">，{item.count} 个文件</span>
              </Button>
            )
          })}
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-4 px-2 pb-5 sm:flex-row sm:gap-6 sm:px-0 sm:pb-0">
          <TranscriptPanel
            title="原文"
            rows={sourceRows}
            tone="pink"
            selectedRow={selectedRow}
            onSelect={setSelectedRow}
          />
          <TranscriptPanel
            title={language}
            rows={translatedRows}
            tone="yellow"
            selectedRow={selectedRow}
            onSelect={setSelectedRow}
            languageOpen={languageOpen}
            onLanguageToggle={() => setLanguageOpen((open) => !open)}
            onLanguageSelect={(nextLanguage) => {
              setLanguage(nextLanguage)
              setLanguageOpen(false)
            }}
          />
        </div>
      </section>
    </main>
  )
}

function TranscriptPanel({
  title,
  rows,
  tone,
  selectedRow,
  onSelect,
  languageOpen,
  onLanguageToggle,
  onLanguageSelect,
}: {
  title: string
  rows: string[]
  tone: "pink" | "yellow"
  selectedRow: number
  onSelect: (row: number) => void
  languageOpen?: boolean
  onLanguageToggle?: () => void
  onLanguageSelect?: (language: string) => void
}) {
  const panelColor = tone === "pink" ? "bg-[#ffc5c7]" : "bg-[#ffed9e]"

  return (
    <article className={`transcript-panel relative flex min-h-[510px] min-w-0 flex-1 flex-col rounded-[26px] border-[2.5px] border-[#202020] px-[14px] pb-3 pt-[27px] sm:h-[548px] sm:min-h-0 sm:min-w-[350px] sm:px-[15px] sm:pt-[29px] ${panelColor}`}>
      <div className="mb-3 border-t-[3px] border-dotted border-[#202020]" />
      <div className="flex flex-1 flex-col">
        {rows.map((row, index) => (
          <button
            key={`${row}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={`flex min-h-[35px] w-full items-center border-b border-[#202020]/60 px-0.5 text-left font-mono text-[17px] leading-none transition-colors sm:text-[18px] ${selectedRow === index ? "bg-white/20" : "hover:bg-white/15"}`}
          >
            {tone === "pink" ? `01.${String(index + 21).padStart(2, "0")}` : row}
          </button>
        ))}
      </div>
      {tone === "yellow" && (
        <div className="absolute -right-[10px] -top-[30px] z-10 sm:-right-[42px] sm:-top-[30px]">
          <Button
            type="button"
            variant="ghost"
            onClick={onLanguageToggle}
            aria-expanded={languageOpen}
            className="language-tag h-[58px] rotate-[-19deg] rounded-[13px] border-[2.5px] border-[#202020] bg-[#ffeb9b] px-5 font-mono text-[17px] font-medium text-[#202020] shadow-[1px_2px_0_#202020] hover:bg-[#ffeb9b] sm:h-[63px] sm:px-6 sm:text-[18px]"
          >
            {title}
          </Button>
          {languageOpen && (
            <div className="absolute right-0 top-[52px] flex rotate-[-19deg] flex-col overflow-hidden rounded-lg border-2 border-[#202020] bg-[#fff8c9] text-sm shadow-[2px_3px_0_#202020]">
              {['English', '日本語', '한국어'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onLanguageSelect?.(option)}
                  className="px-4 py-2 text-left font-mono hover:bg-[#ffed9e]"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
