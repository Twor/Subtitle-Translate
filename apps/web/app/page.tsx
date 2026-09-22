"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type SubtitleCue = {
  id: number
  start: string
  end: string
  text: string
  translation: string
}

type TranslateResponse = {
  translations?: string[]
  error?: string | { message?: string }
}
type BrowserDeepSeekResponse = {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

const demoCues: SubtitleCue[] = [
  { id: 1, start: "00:00:01,000", end: "00:00:04,000", text: "欢迎使用字幕翻译工作台", translation: "" },
  { id: 2, start: "00:00:05,000", end: "00:00:08,000", text: "把每一句话，翻译成更好的表达", translation: "" },
  { id: 3, start: "00:00:09,000", end: "00:00:12,000", text: "选择左侧的文件开始编辑", translation: "" },
  { id: 4, start: "00:00:13,000", end: "00:00:16,000", text: "所有内容都会自动保存", translation: "" },
  { id: 5, start: "00:00:17,000", end: "00:00:20,000", text: "让字幕和文字保持准确", translation: "" },
  { id: 6, start: "00:00:21,000", end: "00:00:24,000", text: "检查时间轴和语言风格", translation: "" },
  { id: 7, start: "00:00:25,000", end: "00:00:28,000", text: "快速预览你的翻译结果", translation: "" },
  { id: 8, start: "00:00:29,000", end: "00:00:32,000", text: "一切准备就绪", translation: "" },
]

const navigation = [
  { label: "字幕", color: "pink", count: 12 },
  { label: "pdf", color: "green", count: 4 },
  { label: "文本", color: "blue", count: 8 },
  { label: "待定", color: "yellow", count: 3 },
  { label: "待定", color: "mint", count: 2 },
] as const

const colorClasses = {
  pink: "bg-[#e6a9c5]",
  green: "bg-[#9bc8a7]",
  blue: "bg-[#83afd5]",
  yellow: "bg-[#eed66d]",
  mint: "bg-[#8bc9ad]",
}

const languages = ["English", "日本語", "한국어", "Français", "Deutsch", "Ελληνικά"]
const interfaceLanguages = ["中文", "English"] as const
const interfaceLanguageTabColors = ["bg-[#f6a6b8]", "bg-[#a9d49d]"] as const
const DEFAULT_TRANSLATION_PROMPT = "You are a professional subtitle translator. Translate naturally and accurately while preserving meaning, tone, character voice, cultural context, and subtitle readability. Do not translate proper nouns inconsistently."
const translationPrompt = process.env.NEXT_PUBLIC_DEEPSEEK_TRANSLATION_PROMPT?.trim() || DEFAULT_TRANSLATION_PROMPT

const uiText = {
  中文: {
    fileTypes: "文件类型",
    source: "原文",
    apiKey: "DeepSeek API Key",
    apiKeyPlaceholder: "不会保存和上传API Key，仅在浏览器直连 DeepSeek",
    browserDirect: "浏览器直连",
    upload: "上传 SRT / TXT",
    chooseFile: "选择字幕文件",
    translate: "开始翻译",
    translating: "翻译中…",
    download: "下载字幕",
    waiting: "等待翻译…",
    language: "界面语言",
  },
  English: {
    fileTypes: "File types",
    source: "Original",
    apiKey: "Page API key",
    apiKeyPlaceholder: "Used first; sent directly from this browser to DeepSeek",
    browserDirect: "Browser direct",
    upload: "Upload SRT / TXT",
    chooseFile: "Choose subtitle file",
    translate: "Translate",
    translating: "Translating…",
    download: "Download subtitles",
    waiting: "Waiting for translation…",
    language: "Interface language",
  },
} as const

export default function Page() {
  const [interfaceLanguage, setInterfaceLanguage] = useState<(typeof interfaceLanguages)[number]>("中文")
  const [activeTab, setActiveTab] = useState("字幕")
  const [targetLanguage, setTargetLanguage] = useState("English")
  const [selectedRow, setSelectedRow] = useState(0)
  const [cues, setCues] = useState<SubtitleCue[]>(demoCues)
  const [fileName, setFileName] = useState("")
  const [pageApiKey, setPageApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("示例字幕已加载，可以上传 .srt 或 .txt 文件")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sourceScrollRef = useRef<HTMLDivElement>(null)
  const translationScrollRef = useRef<HTMLDivElement>(null)
  const syncingScroll = useRef(false)
  const [hydrated, setHydrated] = useState(false)
  const storageKey = "subtitle-translate:workspace"
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      const savedPageApiKey = window.sessionStorage.getItem("subtitle-translate:page-api-key")
      if (savedPageApiKey) setPageApiKey(savedPageApiKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<{
          interfaceLanguage: (typeof interfaceLanguages)[number]
          activeTab: string
          targetLanguage: string
          selectedRow: number
          fileName: string
          cues: SubtitleCue[]
        }>
        if (parsed.interfaceLanguage && interfaceLanguages.includes(parsed.interfaceLanguage)) setInterfaceLanguage(parsed.interfaceLanguage)
        if (Array.isArray(parsed.cues) && parsed.cues.length > 0) setCues(parsed.cues)
        if (typeof parsed.activeTab === "string") setActiveTab(parsed.activeTab)
        if (typeof parsed.targetLanguage === "string") setTargetLanguage(parsed.targetLanguage)
        if (typeof parsed.selectedRow === "number") setSelectedRow(Math.max(0, parsed.selectedRow))
        if (typeof parsed.fileName === "string") setFileName(parsed.fileName)
        setMessage("已恢复上次的字幕工作状态")
      }
    } catch {
      window.localStorage.removeItem(storageKey)
      window.sessionStorage.removeItem("subtitle-translate:page-api-key")
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ interfaceLanguage, activeTab, targetLanguage, selectedRow, fileName, cues }))
    } catch {
      setError("无法保存当前工作状态")
    }
  }, [interfaceLanguage, activeTab, targetLanguage, selectedRow, fileName, cues, hydrated])

  function syncScroll(source: "source" | "translation") {
    if (syncingScroll.current) return
    const target = source === "source" ? translationScrollRef.current : sourceScrollRef.current
    const origin = source === "source" ? sourceScrollRef.current : translationScrollRef.current
    if (!target || !origin) return
    const originMax = origin.scrollHeight - origin.clientHeight
    const targetMax = target.scrollHeight - target.clientHeight
    if (originMax <= 0 || targetMax <= 0) return
    syncingScroll.current = true
    target.scrollTop = (origin.scrollTop / originMax) * targetMax
    requestAnimationFrame(() => {
      syncingScroll.current = false
    })
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (!file) return
    const extension = file.name.toLowerCase().split(".").pop()
    if (extension !== "srt" && extension !== "txt") {
      setError("请选择 .srt 或 .txt 格式的字幕文件")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const content = String(reader.result ?? "")
        const parsed = extension === "txt" ? parseTxt(content) : parseSrt(content)
        setCues(parsed)
        setFileName(file.name)
        setSelectedRow(0)
        setError("")
        setMessage(`已加载 ${parsed.length} 条字幕，请选择目标语言后开始翻译`)
      } catch (parseError) {
        setError(parseError instanceof Error ? parseError.message : `${extension.toUpperCase()} 文件解析失败`)
      }
    }
    reader.onerror = () => setError("无法读取字幕文件")
    reader.readAsText(file, "UTF-8")
  }
  async function translateSubtitles() {
    if (cues.length === 0) return
    setLoading(true)
    setError("")
    try {
      const requestBody = {
        model: "deepseek-flash",
        messages: [
          {
            role: "system",
            content: `${translationPrompt}\n\nAdditional output requirements: Translate subtitle text into ${targetLanguage}. Return valid JSON only in the form {"translations":["..."]}. Keep exactly ${cues.length} items, preserve the numbering order, and do not add explanations. Preserve line breaks inside each subtitle when useful.`,
          },
          {
            role: "user",
            content: cues.map((cue, index) => `${index + 1}. ${cue.text}`).join("\n"),
          },
        ],
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        temperature: 0.2,
        stream: false,
      }
      const response = pageApiKey.trim()
        ? await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${pageApiKey.trim()}` },
            body: JSON.stringify(requestBody),
          })
        : await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetLanguage, cues: cues.map(({ id, start, end, text }) => ({ id, start, end, text })) }),
          })
      const payload = (await response.json()) as TranslateResponse & BrowserDeepSeekResponse
      const translations = pageApiKey.trim() ? parseBrowserTranslations(payload, cues.length) : payload.translations
      if (!response.ok || !translations) {
        const errorMessage = typeof payload.error === "string" ? payload.error : payload.error?.message
        throw new Error(errorMessage || "翻译失败")
      }
      setCues((current) => current.map((cue, index) => ({ ...cue, translation: translations[index] ?? "" })))
      setMessage(`翻译完成：${cues.length} 条字幕已生成 ${targetLanguage} 版本`)
    } catch (translateError) {
      setError(translateError instanceof Error ? translateError.message : "翻译失败")
      setMessage("")
    } finally {
      setLoading(false)
    }
  }

  function handlePageApiKeyChange(value: string) {
    setPageApiKey(value)
    if (value.trim()) window.sessionStorage.setItem("subtitle-translate:page-api-key", value)
    else window.sessionStorage.removeItem("subtitle-translate:page-api-key")
  }
  function downloadSubtitles() {
    if (!cues.some((cue) => cue.translation.trim())) {
      setError("请先完成翻译，再下载字幕")
      return
    }

    const isTxt = fileName.toLowerCase().endsWith(".txt")
    const content = isTxt
      ? `${cues.map((cue) => cue.translation || cue.text).join("\n")}\n`
      : `${cues
          .map((cue) => `${cue.id}\n${cue.start} --> ${cue.end}\n${cue.translation || cue.text}`)
          .join("\n\n")}\n`
    const extension = isTxt ? "txt" : "srt"
    const baseName = fileName.replace(/\.(?:srt|txt)$/i, "") || "translated-subtitles"
    const url = URL.createObjectURL(new Blob([content], { type: isTxt ? "text/plain;charset=utf-8" : "application/x-subrip;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `${baseName}.${targetLanguage}.${extension}`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#bb8051] px-3 py-6 text-[#202020] sm:px-8 sm:py-10">
      <StudyBackdrop />
      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[1120px] flex-col items-stretch sm:min-h-[680px]">
        <div className="relative z-20 mb-0 flex h-9 justify-end sm:ml-[70px] sm:w-[calc(100%-70px)] sm:pr-16">
          <div aria-label={uiText[interfaceLanguage].language} className="flex items-end gap-1">
            {interfaceLanguages.map((language, index) => <button key={language} type="button" aria-pressed={interfaceLanguage === language} title={language} onClick={() => setInterfaceLanguage(language)} className={cn("relative h-7 min-w-16 rounded-t-md border-2 border-b-0 border-[#d1aa79] px-2 font-mono text-[11px] font-bold text-[#59422f] shadow-[2px_-2px_4px_rgba(93,59,31,0.12)] transition-all hover:-translate-y-1 sm:min-w-20", interfaceLanguageTabColors[index], interfaceLanguage === language ? "z-10 h-9 -translate-y-0.5 brightness-110" : "opacity-80")}>{language}</button>)}
          </div>
        </div>
        <nav
          aria-label={uiText[interfaceLanguage].fileTypes}
          className="z-30 flex shrink-0 gap-2 pb-4 sm:absolute sm:left-0 sm:top-[305px] sm:-translate-y-1/2 sm:flex-col sm:gap-1 sm:pb-0"
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
                  "h-10 min-w-14 rounded-[11px] border-2 border-[#202020] px-2 font-mono text-sm font-medium leading-none text-[#202020] shadow-[1px_2px_0_#202020] transition-transform hover:-translate-y-0.5 hover:bg-inherit sm:h-11 sm:min-w-[68px] sm:rounded-l-[11px] sm:rounded-r-none sm:border-r-0 sm:text-[15px]",
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

        <div className="notebook-spread relative flex w-full min-w-0 flex-1 flex-col overflow-visible rounded-[24px] border-[6px] border-[#4f2d2b] bg-[#6f3e35] p-2 shadow-[14px_18px_0_rgba(74,39,23,0.24)] sm:ml-[70px] sm:w-[calc(100%-70px)] sm:flex-none sm:flex-row sm:p-4">
          <NotebookPage title={uiText[interfaceLanguage].source} cues={cues} side="left" selectedRow={selectedRow} onSelect={setSelectedRow} scrollRef={sourceScrollRef} onScroll={() => syncScroll("source")} waitingText={uiText[interfaceLanguage].waiting} />
          <NotebookPage title={targetLanguage} cues={cues} side="right" selectedRow={selectedRow} onSelect={setSelectedRow} scrollRef={translationScrollRef} onScroll={() => syncScroll("translation")} onLanguageSelect={setTargetLanguage} waitingText={uiText[interfaceLanguage].waiting} />
          <NotebookBinding />
        </div>
        <div className="mt-3 flex w-full flex-col gap-3 sm:ml-[70px] sm:w-[calc(100%-70px)] sm:flex-row sm:items-center">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-[#202020] bg-[#fff4c7]/95 px-3 shadow-[2px_3px_0_rgba(32,32,32,0.3)]">
            <span className="shrink-0 font-mono text-xs font-semibold">{uiText[interfaceLanguage].apiKey}</span>
            <input type="password" value={pageApiKey} onChange={(event) => handlePageApiKeyChange(event.currentTarget.value)} placeholder={uiText[interfaceLanguage].apiKeyPlaceholder} aria-label="页面 DeepSeek API Key" className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-[#202020]/45" />
            {pageApiKey && <span className="shrink-0 font-mono text-[10px] text-[#315d3b]">{uiText[interfaceLanguage].browserDirect}</span>}
          </label>
        </div>
        <div className="mt-5 mb-4 grid w-full gap-3 sm:ml-[70px] sm:w-[calc(100%-70px)] sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <label className="flex h-10 min-w-0 cursor-pointer items-center gap-3 rounded-xl border-2 border-[#202020] bg-[#f7dfb6]/90 px-3 shadow-[2px_3px_0_rgba(32,32,32,0.35)]">
            <input ref={fileInputRef} type="file" accept=".srt,.txt,application/x-subrip,text/plain" onChange={handleFileChange} className="sr-only" />
            <span className="inline-flex h-7 items-center rounded-lg border-2 border-[#202020] bg-[#ffc5c7] px-3 font-mono text-sm font-semibold">{uiText[interfaceLanguage].upload}</span>
            <span className="truncate font-mono text-xs sm:text-sm">{fileName || uiText[interfaceLanguage].chooseFile}</span>
          </label>
          <Button type="button" onClick={translateSubtitles} disabled={loading || cues.length === 0} className="h-10 justify-self-center rounded-lg border-2 border-[#202020] bg-[#b6efc0] px-5 font-mono text-sm font-semibold text-[#202020] shadow-[1px_2px_0_#202020] hover:bg-[#b6efc0]/85">
            {loading ? uiText[interfaceLanguage].translating : uiText[interfaceLanguage].translate}
          </Button>
          <Button type="button" variant="outline" onClick={downloadSubtitles} disabled={!cues.some((cue) => cue.translation.trim()) || loading} className="h-10 justify-self-stretch rounded-lg border-2 border-[#202020] bg-[#fff4c7] px-5 font-mono text-sm font-semibold text-[#202020] shadow-[1px_2px_0_#202020] hover:bg-[#fff4c7]/85 sm:justify-self-end">
            {uiText[interfaceLanguage].download}
          </Button>
        </div>
        {(message || error) && <p role={error ? "alert" : "status"} className={cn("mb-3 w-full rounded-lg px-3 py-2 font-mono text-xs sm:ml-[70px] sm:w-[calc(100%-70px)]", error ? "bg-[#ffc5c7]" : "bg-[#fff4c7]/90")}>{error || message}</p>}
      </section>
    </main>
  )
}
function parseBrowserTranslations(payload: BrowserDeepSeekResponse, expectedCount: number): string[] {
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error(payload.error?.message || "DeepSeek 没有返回翻译结果")
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error("DeepSeek 返回的翻译不是有效 JSON")
  }
  if (!parsed || typeof parsed !== "object" || !("translations" in parsed) || !Array.isArray(parsed.translations)) {
    throw new Error("DeepSeek 返回的字幕格式不正确")
  }
  const translations = parsed.translations
  if (translations.length !== expectedCount || translations.some((translation) => typeof translation !== "string")) {
    throw new Error("DeepSeek 返回的字幕数量不正确")
  }
  return translations
}

function parseTxt(input: string): SubtitleCue[] {
  const lines = input.replace(/^\uFEFF/, "").replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0) throw new Error("TXT 文件没有可用字幕")
  return lines.map((text, index) => ({ id: index + 1, start: "", end: "", text, translation: "" }))
}

function parseSrt(input: string): SubtitleCue[] {
  const blocks = input.replace(/^\uFEFF/, "").replace(/\r/g, "").trim().split(/\n{2,}/).filter(Boolean)
  const cues = blocks.map((block, index) => {
    const lines = block.split("\n")
    const timingIndex = lines.findIndex((line) => line.includes("-->"))
    if (timingIndex < 0) throw new Error(`第 ${index + 1} 段缺少时间轴`)
    const timing = lines[timingIndex]?.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/)
    const start = timing?.[1] ?? ""
    const end = timing?.[2] ?? ""
    const text = lines.slice(timingIndex + 1).join("\n").trim()
    if (!timing || !start || !end || !text) throw new Error(`第 ${index + 1} 段字幕格式无效`)
    return { id: index + 1, start: start.replace(".", ","), end: end.replace(".", ","), text, translation: "" }
  })
  if (cues.length === 0) throw new Error("SRT 文件没有可用字幕")
  return cues
}

function StudyBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(118deg,#99613d_0%,#c88b58_44%,#e1ad76_100%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(92deg,transparent_0,transparent_95px,rgba(92,52,29,0.28)_96px,transparent_99px),repeating-linear-gradient(3deg,transparent_0,transparent_138px,rgba(255,224,176,0.2)_140px,transparent_143px)]" />
      <div className="absolute -left-32 -top-40 size-[520px] rounded-full bg-[#ffe8b6]/35 blur-3xl sm:size-[760px]" />
      <div className="absolute right-[-8%] top-[-12%] size-[52vw] max-size-[720px] rounded-full bg-[#fff5cb]/25 blur-3xl" />
      <div className="absolute left-[-7%] top-[-7%] h-[430px] w-[230px] rotate-[25deg] rounded-[45%] bg-[#425e3b]/55 blur-[3px] sm:h-[600px] sm:w-[320px]" />
      <div className="absolute left-[9%] top-[-10%] h-[400px] w-[150px] rotate-[47deg] rounded-[50%] bg-[#506b40]/40 blur-[4px] sm:h-[600px] sm:w-[220px]" />
      <div className="absolute right-[5%] top-[5%] h-[280px] w-[125px] rotate-[-26deg] rounded-[50%] bg-[#4b6139]/35 blur-[4px] sm:h-[430px] sm:w-[180px]" />
      <div className="absolute bottom-[7%] left-[4%] hidden h-32 w-28 rotate-[-12deg] rounded-xl border-4 border-[#5a321e]/45 bg-[#d8b078]/70 shadow-[8px_12px_0_rgba(77,42,22,0.18)] sm:block" />
      <div className="absolute bottom-[9%] right-[3%] hidden h-24 w-36 rotate-[9deg] rounded-xl border-4 border-[#5a321e]/40 bg-[#ead0a1]/75 shadow-[7px_10px_0_rgba(77,42,22,0.2)] sm:block" />
      <div className="absolute bottom-[-80px] right-[15%] size-48 rounded-full border-[18px] border-[#34251e]/65 bg-[#573827]/55 shadow-inner sm:size-64" />
      <div className="absolute bottom-[7%] right-[19%] h-16 w-24 rotate-[-18deg] rounded-[45%] bg-[#eee1c2]/70 shadow-[5px_7px_0_rgba(62,35,23,0.2)] sm:h-20 sm:w-32" />
      <div className="absolute bottom-[12%] left-[18%] h-3 w-36 rotate-[22deg] rounded-full bg-[#f4e0b5]/80 shadow-[0_3px_0_rgba(75,42,22,0.25)] sm:left-[22%] sm:w-52" />
      <div className="absolute right-[4%] top-[16%] hidden h-10 w-64 rotate-[14deg] rounded border-2 border-[#694127]/60 bg-[#f5d889]/75 shadow-[5px_7px_0_rgba(74,39,23,0.2)] sm:block lg:w-80">
        <div className="absolute inset-x-3 bottom-1 h-4 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_14px,#694127_15px,#694127_16px)] opacity-55" />
        <span className="absolute left-3 top-1 font-mono text-[9px] font-bold tracking-[0.2em] text-[#694127]/70">STUDY / 30 CM</span>
      </div>
      <div className="absolute bottom-[20%] left-[5%] hidden h-6 w-60 rotate-[-19deg] items-center drop-shadow-[5px_7px_0_rgba(74,39,23,0.2)] sm:flex lg:left-[9%] lg:w-72">
        <div className="h-full w-8 rounded-l-md border-2 border-r-0 border-[#57321f] bg-[#e76f51]" />
        <div className="h-full flex-1 border-y-2 border-[#57321f] bg-[#f2c14e] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_5px,rgba(255,255,255,0.22)_6px)]" />
        <div className="h-0 w-0 border-y-[12px] border-l-[24px] border-y-transparent border-l-[#e8c69a]" />
        <div className="-ml-1 h-0 w-0 border-y-[4px] border-l-[8px] border-y-transparent border-l-[#27221f]" />
      </div>
      <div className="absolute bottom-[8%] right-[4%] hidden h-20 w-52 rotate-[-8deg] rounded-[18px] border-4 border-[#57321f]/75 bg-[#d86f4c]/85 shadow-[8px_10px_0_rgba(74,39,23,0.22)] sm:block lg:right-[8%] lg:h-24 lg:w-64">
        <div className="absolute inset-x-3 top-1/2 border-t-2 border-dashed border-[#f7d79c]/80" />
        <div className="absolute right-5 top-[calc(50%-5px)] size-2 rounded-full bg-[#f7d79c]" />
        <span className="absolute bottom-2 left-4 font-mono text-[10px] font-bold tracking-[0.24em] text-[#fff0c7]/85">PENS & NOTES</span>
      </div>
      <div className="absolute left-[3%] top-[12%] hidden h-28 w-40 rotate-[-12deg] sm:block lg:left-[8%] lg:h-36 lg:w-52">
        <div className="absolute left-3 top-3 h-full w-full rounded border-2 border-[#694127]/35 bg-[#f8e8bc]/55 shadow-[5px_7px_0_rgba(74,39,23,0.12)]" />
        <div className="absolute h-full w-full rounded border-2 border-[#694127]/55 bg-[#fff3cc]/75 shadow-[5px_7px_0_rgba(74,39,23,0.18)]">
          <div className="absolute left-5 right-5 top-7 border-t border-dashed border-[#b77a4d]/60" />
          <div className="absolute left-5 right-12 top-12 border-t border-dashed border-[#b77a4d]/60" />
          <div className="absolute bottom-4 right-4 size-6 rounded-full border-2 border-[#e76f51]/60" />
        </div>
      </div>
    </div>
  )
}


function NotebookPage({ title, cues, side, selectedRow, onSelect, scrollRef, onScroll, onLanguageSelect, waitingText }: { title: string; cues: SubtitleCue[]; side: "left" | "right"; selectedRow: number; onSelect: (row: number) => void; scrollRef: React.RefObject<HTMLDivElement | null>; onScroll: () => void; onLanguageSelect?: (language: string) => void; waitingText: string }) {
  const isLeft = side === "left"
  return (
    <article className={cn("relative z-10 flex min-h-[520px] min-w-0 flex-1 flex-col border-2 border-[#a99579] px-5 pb-5 pt-9 shadow-[inset_0_0_22px_rgba(134,94,47,0.08)] sm:h-[610px] sm:min-h-0 sm:px-10 sm:pt-12", isLeft ? "rounded-t-[18px] bg-[#fffdf4] sm:rounded-l-[18px] sm:rounded-r-none" : "rounded-b-[18px] bg-[#f8efd9] sm:rounded-l-none sm:rounded-r-[18px] sm:pl-12")}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-3 top-3 bottom-3 z-0 w-3 rounded-r-[12px] border-y-2 border-r-2 border-[#a99579] bg-[repeating-linear-gradient(0deg,#e1d1b2_0,#e1d1b2_3px,#cdbb9c_4px,#e1d1b2_5px)] shadow-[2px_3px_0_rgba(81,43,30,0.18)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-3 left-3 right-3 z-0 h-3 rounded-b-[12px] border-x-2 border-b-2 border-[#a99579] bg-[#d6c3a3] shadow-[2px_3px_0_rgba(81,43,30,0.18)]" />
      <div className="relative z-10 mb-3 flex items-center gap-3"><span className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-[#202020]/60">{title}</span><div className="flex-1 border-t-2 border-dotted border-[#202020]/80" /></div>
      <div ref={scrollRef} onScroll={onScroll} className="relative z-10 scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pr-1">
        {cues.map((cue, index) => <button key={cue.id} type="button" onClick={() => onSelect(index)} className={cn("flex min-h-[52px] w-full shrink-0 flex-col justify-center overflow-hidden border-b border-[#202020]/45 px-0.5 text-left font-mono text-[13px] leading-tight transition-colors sm:text-[15px]", selectedRow === index ? "bg-white/25" : "hover:bg-white/20")}><span className="mb-1 text-[10px] text-[#202020]/55">{cue.id}{cue.start && cue.end ? ` · ${cue.start} → ${cue.end}` : ""}</span><span className="whitespace-pre-wrap">{isLeft ? cue.text : cue.translation || waitingText}</span></button>)}
      </div>
      {!isLeft && <LanguageBookmarks selected={title} onSelect={onLanguageSelect} />}
    </article>
  )
}

const languageBookmarkStyles = [
  { color: "bg-[#59b77d]", short: "EN" },
  { color: "bg-[#69c78c]", short: "日" },
  { color: "bg-[#f0a148]", short: "한" },
  { color: "bg-[#ef8739]", short: "FR" },
  { color: "bg-[#df4050]", short: "DE" },
  { color: "bg-[#c93249]", short: "ΕΛ" },
] as const

function LanguageBookmarks({ selected, onSelect }: { selected: string; onSelect?: (language: string) => void }) {
  return <div aria-label="翻译语言" className="absolute right-1 top-24 z-30 flex -translate-y-1/2 flex-col gap-0.5 sm:-right-[58px] sm:top-1/2 sm:translate-y-[-50%]">{languages.map((language, index) => { const bookmark = languageBookmarkStyles[index]!; const isSelected = selected === language; return <button key={language} type="button" aria-label={`选择${language}`} aria-pressed={isSelected} onClick={() => onSelect?.(language)} className={cn("group relative flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-r-[10px] border-2 border-l-0 border-[#8b6047] px-1 shadow-[2px_2px_0_rgba(81,43,30,0.25)] transition-transform hover:translate-x-1 sm:h-11 sm:w-[62px] sm:rounded-r-[9px]", bookmark.color, isSelected && "translate-x-1 brightness-110 ring-2 ring-[#fff5c9] ring-offset-1 ring-offset-[#6f3e35]")}><span aria-hidden="true" className="font-mono text-[10px] font-bold tracking-tight text-white drop-shadow-[0_1px_1px_rgba(81,43,30,0.38)] sm:text-[11px]">{bookmark.short}</span><span className="sr-only">{language}</span></button> })}</div>
}


function NotebookBinding() {
  return <div aria-hidden="true" className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 h-8 -translate-y-1/2 sm:bottom-0 sm:left-1/2 sm:right-auto sm:top-0 sm:h-auto sm:w-12 sm:-translate-x-1/2 sm:translate-y-0"><div className="absolute inset-x-0 top-1/2 border-t-2 border-[#202020]/35 sm:inset-y-0 sm:inset-x-auto sm:left-1/2 sm:w-px sm:-translate-x-1/2 sm:border-l-2 sm:border-t-0 sm:border-[#202020]/25" /><div className="relative flex h-full w-full justify-around px-4 sm:flex-col sm:justify-between sm:px-0 sm:py-4">{Array.from({ length: 16 }, (_, index) => <span key={index} className="h-3 w-7 rounded-full border-2 border-[#777] bg-gradient-to-b from-[#f5f5f5] via-[#a7a7a7] to-[#f8f8f8] shadow-[0_1px_1px_rgba(0,0,0,0.35)] sm:h-3 sm:w-8" />)}</div></div>
}
