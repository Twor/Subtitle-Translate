"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

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
    <main className="min-h-svh overflow-x-hidden bg-[#ededed] px-3 py-6 text-[#202020] sm:px-8 sm:py-10">
      <section className="relative mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[1120px] flex-col items-stretch sm:min-h-[680px] sm:flex-row sm:items-center">
        <nav
          aria-label="文件类型"
          className="z-30 flex shrink-0 gap-2 pb-4 sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 sm:flex-col sm:gap-3 sm:pb-0"
        >
          {navigation.map((item) => {
            const active = activeTab === item.label

            return (
              <Button
                key={`${item.color}-${item.label}`}
                type="button"
                variant="ghost"
                onClick={() => setActiveTab(item.label)}
                aria-pressed={active}
                className={cn(
                  "h-10 min-w-14 rounded-[11px] border-2 border-[#202020] px-2 font-mono text-lg font-medium leading-none text-[#202020] shadow-[1px_2px_0_#202020] transition-transform hover:-translate-y-0.5 hover:bg-inherit sm:h-11 sm:min-w-[68px] sm:text-[21px]",
                  colorClasses[item.color],
                  active && "-translate-x-1",
                )}
              >
                {item.label}
                <span className="sr-only">，{item.count} 个文件</span>
              </Button>
            )
          })}
        </nav>

        <div className="notebook-spread relative flex w-full min-w-0 flex-1 flex-col overflow-visible rounded-[30px] drop-shadow-[12px_16px_7px_rgba(0,0,0,0.2)] sm:ml-[70px] sm:flex-row">
          <NotebookPage
            title="原文"
            rows={sourceRows}
            side="left"
            selectedRow={selectedRow}
            onSelect={setSelectedRow}
          />
          <NotebookPage
            title={language}
            rows={translatedRows}
            side="right"
            selectedRow={selectedRow}
            onSelect={setSelectedRow}
            languageOpen={languageOpen}
            onLanguageToggle={() => setLanguageOpen((open) => !open)}
            onLanguageSelect={(nextLanguage) => {
              setLanguage(nextLanguage)
              setLanguageOpen(false)
            }}
          />
          <NotebookBinding />
        </div>
      </section>
    </main>
  )
}

function NotebookPage({
  title,
  rows,
  side,
  selectedRow,
  onSelect,
  languageOpen,
  onLanguageToggle,
  onLanguageSelect,
}: {
  title: string
  rows: string[]
  side: "left" | "right"
  selectedRow: number
  onSelect: (row: number) => void
  languageOpen?: boolean
  onLanguageToggle?: () => void
  onLanguageSelect?: (language: string) => void
}) {
  const isLeft = side === "left"

  return (
    <article
      className={cn(
        "relative flex min-h-[520px] min-w-0 flex-1 flex-col border-2 border-[#202020] px-5 pb-5 pt-9 sm:h-[610px] sm:min-h-0 sm:px-10 sm:pt-12",
        isLeft
          ? "rounded-t-[28px] bg-[#d7c09e] sm:rounded-l-[30px] sm:rounded-r-none"
          : "rounded-b-[28px] bg-[#fffefe] sm:rounded-l-none sm:rounded-r-[30px] sm:pl-12",
        isLeft && "notebook-cover",
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-[#202020]/60">
          {title}
        </span>
        <div className="flex-1 border-t-2 border-dotted border-[#202020]/80" />
      </div>

      <div className="flex flex-1 flex-col">
        {rows.map((row, index) => (
          <button
            key={`${row}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "flex min-h-[35px] w-full items-center overflow-hidden border-b border-[#202020]/45 px-0.5 text-left font-mono text-[14px] leading-none transition-colors sm:text-[16px]",
              selectedRow === index ? "bg-white/25" : "hover:bg-white/20",
            )}
          >
            <span className="truncate">{row}</span>
          </button>
        ))}
      </div>

      {!isLeft && (
        <LanguagePicker
          title={title}
          open={languageOpen}
          onToggle={onLanguageToggle}
          onSelect={onLanguageSelect}
        />
      )}
    </article>
  )
}

function LanguagePicker({
  title,
  open,
  onToggle,
  onSelect,
}: {
  title: string
  open?: boolean
  onToggle?: () => void
  onSelect?: (language: string) => void
}) {
  return (
    <div className="absolute -right-2 -top-5 z-30 sm:-right-8 sm:-top-7">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        aria-expanded={open}
        className="h-14 rotate-[-17deg] rounded-[13px] border-2 border-[#202020] bg-[#ffeb9b] px-4 font-mono text-[15px] font-semibold text-[#202020] shadow-[1px_2px_0_#202020] hover:bg-[#ffeb9b] sm:h-16 sm:px-6 sm:text-[17px]"
      >
        {title}
      </Button>
      {open && (
        <div className="absolute right-0 top-12 flex rotate-[-17deg] flex-col overflow-hidden rounded-lg border-2 border-[#202020] bg-[#fff8c9] text-sm shadow-[2px_3px_0_#202020]">
          {["English", "日本語", "한국어"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSelect?.(option)}
              className="px-4 py-2 text-left font-mono hover:bg-[#ffed9e]"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function NotebookBinding() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 h-8 -translate-y-1/2 sm:bottom-0 sm:left-1/2 sm:right-auto sm:top-0 sm:h-auto sm:w-12 sm:-translate-x-1/2 sm:translate-y-0"
    >
      <div className="absolute inset-x-0 top-1/2 border-t-2 border-[#202020]/35 sm:inset-y-0 sm:inset-x-auto sm:left-1/2 sm:w-px sm:-translate-x-1/2 sm:border-l-2 sm:border-t-0 sm:border-[#202020]/25" />
      <div className="relative flex h-full w-full justify-around px-4 sm:flex-col sm:justify-between sm:px-0 sm:py-4">
        {Array.from({ length: 16 }, (_, index) => (
          <span
            key={index}
            className="h-3 w-7 rounded-full border-2 border-[#777] bg-gradient-to-b from-[#f5f5f5] via-[#a7a7a7] to-[#f8f8f8] shadow-[0_1px_1px_rgba(0,0,0,0.35)] sm:h-3 sm:w-8"
          />
        ))}
      </div>
    </div>
  )
}
