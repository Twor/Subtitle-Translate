"use client"

import { useEffect, useRef, useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type SubtitleCue = {
  id: number
  start: string
  end: string
  text: string
  translation: string
  translations?: Record<string, string>
}

type BrowserDeepSeekResponse = {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

const languages = ["English", "中文", "日本語", "한국어", "Français", "Deutsch", "Ελληνικά"]
const demoTranslationLines: Record<string, string[]> = {
  English: [
    "Welcome to the subtitle translation workspace",
    "Turn every line into a better expression",
    "Choose a file on the left to start editing",
    "Everything is saved automatically",
    "Keep subtitles and text accurate",
    "Check the timeline and language style",
    "Quickly preview your translation",
    "Everything is ready",
  ],
  中文: [
    "欢迎使用字幕翻译工作台",
    "把每一句话，翻译成更好的表达",
    "选择左侧的文件开始编辑",
    "所有内容都会自动保存",
    "让字幕和文字保持准确",
    "检查时间轴和语言风格",
    "快速预览你的翻译结果",
    "一切准备就绪",
  ],
  日本語: [
    "字幕翻訳ワークスペースへようこそ",
    "一つひとつの文章を、よりよい表現に",
    "左側のファイルを選んで編集を始めましょう",
    "すべての内容は自動的に保存されます",
    "字幕と文章を正確に保ちましょう",
    "タイムラインと言葉のスタイルを確認しましょう",
    "翻訳結果をすぐにプレビューできます",
    "準備が整いました",
  ],
  한국어: [
    "자막 번역 작업 공간에 오신 것을 환영합니다",
    "모든 문장을 더 나은 표현으로 바꿔 보세요",
    "왼쪽에서 파일을 선택해 편집을 시작하세요",
    "모든 내용은 자동으로 저장됩니다",
    "자막과 문장의 정확성을 유지하세요",
    "타임라인과 언어 스타일을 확인하세요",
    "번역 결과를 빠르게 미리 볼 수 있습니다",
    "모든 준비가 끝났습니다",
  ],
  Français: [
    "Bienvenue dans l’espace de traduction des sous-titres",
    "Transformez chaque phrase en une meilleure formulation",
    "Choisissez un fichier à gauche pour commencer",
    "Tout le contenu est enregistré automatiquement",
    "Gardez les sous-titres et le texte précis",
    "Vérifiez la timeline et le style de langue",
    "Prévisualisez rapidement votre traduction",
    "Tout est prêt",
  ],
  Deutsch: [
    "Willkommen im Arbeitsbereich für Untertitelübersetzungen",
    "Formuliere jeden Satz noch besser",
    "Wähle links eine Datei, um mit der Bearbeitung zu beginnen",
    "Alle Inhalte werden automatisch gespeichert",
    "Halte Untertitel und Text präzise",
    "Prüfe die Zeitleiste und den Sprachstil",
    "Zeige deine Übersetzung schnell in der Vorschau an",
    "Alles ist bereit",
  ],
  Ελληνικά: [
    "Καλώς ήρθατε στον χώρο εργασίας μετάφρασης υποτίτλων",
    "Μετατρέψτε κάθε φράση σε μια καλύτερη διατύπωση",
    "Επιλέξτε ένα αρχείο αριστερά για να ξεκινήσετε την επεξεργασία",
    "Όλο το περιεχόμενο αποθηκεύεται αυτόματα",
    "Διατηρήστε τους υπότιτλους και το κείμενο ακριβή",
    "Ελέγξτε τη γραμμή χρόνου και το γλωσσικό ύφος",
    "Προβάλετε γρήγορα τη μετάφρασή σας",
    "Όλα είναι έτοιμα",
  ],
}

const demoCueData = [
  { id: 1, start: "00:00:01,000", end: "00:00:04,000", text: "欢迎使用字幕翻译工作台" },
  { id: 2, start: "00:00:05,000", end: "00:00:08,000", text: "把每一句话，翻译成更好的表达" },
  { id: 3, start: "00:00:09,000", end: "00:00:12,000", text: "选择左侧的文件开始编辑" },
  { id: 4, start: "00:00:13,000", end: "00:00:16,000", text: "所有内容都会自动保存" },
  { id: 5, start: "00:00:17,000", end: "00:00:20,000", text: "让字幕和文字保持准确" },
  { id: 6, start: "00:00:21,000", end: "00:00:24,000", text: "检查时间轴和语言风格" },
  { id: 7, start: "00:00:25,000", end: "00:00:28,000", text: "快速预览你的翻译结果" },
  { id: 8, start: "00:00:29,000", end: "00:00:32,000", text: "一切准备就绪" },
]

const demoCues: SubtitleCue[] = demoCueData.map((cue, index) => ({
  ...cue,
  translation: demoTranslationLines.English![index]!,
  translations: Object.fromEntries(languages.map((language) => [language, demoTranslationLines[language]![index]!])),
}))

const interfaceLanguages = ["中文", "English"] as const
const interfaceLanguageTabColors = ["bg-[#f6a6b8]", "bg-[#a9d49d]"] as const
const DEFAULT_TRANSLATION_PROMPT = "You are a professional subtitle translator. Translate naturally and accurately while preserving meaning, tone, character voice, cultural context, and subtitle readability. Do not translate proper nouns inconsistently."
const translationPrompt = process.env.NEXT_PUBLIC_DEEPSEEK_TRANSLATION_PROMPT?.trim() || DEFAULT_TRANSLATION_PROMPT


const uiText = {
  中文: {
    fileTypes: "文件类型",
    source: "原文",
    apiKey: "DeepSeek API Key:",
    apiKeyPlaceholder: "仅暂存在当前浏览器会话，翻译请求会发送给 DeepSeek",
    browserDirect: "浏览器直连",
    upload: "上传 SRT / TXT",
    chooseFile: "选择字幕文件",
    removeFile: "删除文件",
    fileRemoved: "已恢复默认字幕",
    translate: "开始翻译",
    translating: "翻译中…",
    download: "下载字幕",
    waiting: "等待翻译…",
    language: "界面语言",
    status: {
      exampleLoaded: "示例字幕已加载，可以上传 .srt 或 .txt 文件",
      restored: "已恢复上次的字幕工作状态",
      loaded: (count: number) => `已加载 ${count} 条字幕，请选择目标语言后开始翻译`,
      translated: (count: number, language: string) => `翻译完成：${count} 条字幕已生成 ${language} 版本`,
    },
    errors: {
      storage: "无法保存当前工作状态",
      missingApiKey: "请先填写 DeepSeek API Key",
      invalidApiKey: "DeepSeek API Key 无效或已失效，请重新粘贴 sk- 开头的 Key",
      insufficientBalance: "DeepSeek 账户余额不足，请充值后重试",
      rateLimited: "DeepSeek 请求过于频繁，请稍后再试",
      serviceUnavailable: "DeepSeek 服务暂不可用，请稍后再试",
      invalidRequest: (status: number) => `DeepSeek 拒绝了翻译请求（HTTP ${status}），请检查请求参数后重试`,
      invalidFile: "请选择 .srt 或 .txt 格式的字幕文件",
      readFile: "无法读取字幕文件",
      parseFile: (extension: string) => `${extension.toUpperCase()} 文件解析失败`,
      translation: "翻译失败，请检查网络连接或 DeepSeek 服务状态",
      noTranslation: "请先完成翻译，再下载字幕",
    },
  },
  English: {
    fileTypes: "File types",
    source: "Original",
    apiKey: "DeepSeek API Key:",
    apiKeyPlaceholder: "Used first; sent directly from this browser to DeepSeek",
    browserDirect: "Browser direct",
    upload: "Upload SRT / TXT",
    chooseFile: "Choose subtitle file",
    removeFile: "Remove file",
    fileRemoved: "Default subtitles restored",
    translate: "Translate",
    translating: "Translating…",
    download: "Download subtitles",
    waiting: "Waiting for translation…",
    language: "Interface language",
    status: {
      exampleLoaded: "Example subtitles loaded. You can upload an .srt or .txt file",
      restored: "Previous subtitle workspace restored",
      loaded: (count: number) => `${count} subtitles loaded. Choose a target language to start translating`,
      translated: (count: number, language: string) => `Translation complete: ${count} subtitles generated in ${language}`,
    },
    errors: {
      storage: "Unable to save the current workspace",
      missingApiKey: "Enter your DeepSeek API key before translating",
      invalidApiKey: "This DeepSeek API key is invalid or expired. Paste a current key beginning with sk-",
      insufficientBalance: "Your DeepSeek account has insufficient balance. Top up and try again",
      rateLimited: "DeepSeek is receiving requests too quickly. Wait a moment and try again",
      serviceUnavailable: "DeepSeek is temporarily unavailable. Try again shortly",
      invalidRequest: (status: number) => `DeepSeek rejected the translation request (HTTP ${status}). Check the request and try again`,
      invalidFile: "Choose an .srt or .txt subtitle file",
      readFile: "Unable to read the subtitle file",
      parseFile: (extension: string) => `Unable to parse the ${extension.toUpperCase()} file`,
      translation: "Translation failed. Check your network connection or DeepSeek service status",
      noTranslation: "Complete the translation before downloading subtitles",
    },
  },
} as const

type StatusMessage =
  | { type: "exampleLoaded" }
  | { type: "restored" }
  | { type: "loaded"; count: number }
  | { type: "fileRemoved" }
  | { type: "translated"; count: number; language: string }

type ErrorMessage =
  | { type: "storage" }
  | { type: "invalidFile" }
  | { type: "readFile" }
  | { type: "parseFile"; extension: string }
  | { type: "translation" }
  | { type: "invalidApiKey" }
  | { type: "insufficientBalance" }
  | { type: "rateLimited" }
  | { type: "serviceUnavailable" }
  | { type: "invalidRequest"; status: number }
  | { type: "missingApiKey" }
  | { type: "noTranslation" }

function getStatusText(message: StatusMessage, language: keyof typeof uiText): string {
  const status = uiText[language].status
  if (message.type === "exampleLoaded") return status.exampleLoaded
  if (message.type === "restored") return status.restored
  if (message.type === "loaded") return status.loaded(message.count)
  if (message.type === "fileRemoved") return uiText[language].fileRemoved
  return status.translated(message.count, message.language)
}

function getErrorText(error: ErrorMessage, language: keyof typeof uiText): string {
  const errors = uiText[language].errors
  if (error.type === "storage") return errors.storage
  if (error.type === "invalidFile") return errors.invalidFile
  if (error.type === "readFile") return errors.readFile
  if (error.type === "parseFile") return errors.parseFile(error.extension)
  if (error.type === "invalidApiKey") return errors.invalidApiKey
  if (error.type === "insufficientBalance") return errors.insufficientBalance
  if (error.type === "rateLimited") return errors.rateLimited
  if (error.type === "serviceUnavailable") return errors.serviceUnavailable
  if (error.type === "invalidRequest") return errors.invalidRequest(error.status)
  if (error.type === "missingApiKey") return errors.missingApiKey
  return errors.translation
}
function restoreCue(cue: SubtitleCue): SubtitleCue {
  if (cue.translations) return cue
  const demoCue = demoCues.find((candidate) => candidate.id === cue.id && candidate.text === cue.text)
  return demoCue ? { ...cue, translation: cue.translation || demoCue.translation, translations: demoCue.translations } : cue
}

function getTranslation(cue: SubtitleCue, language: string): string {
  return cue.translations?.[language] || (language === "English" ? cue.translation : "")
}
function normalizePageApiKey(value: string): string {
 let key = value.normalize("NFKC").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim()
 key = key.replace(/^["'`]+|["'`]+$/g, "").trim()
 key = key.replace(/^Bearer\s+/i, "").trim()
 key = key.replace(/^["'`]+|["'`]+$/g, "").trim()
 return key.replace(/\s+/g, "")
}

export default function Page() {
  const [interfaceLanguage, setInterfaceLanguage] = useState<(typeof interfaceLanguages)[number]>("中文")
  const [targetLanguage, setTargetLanguage] = useState("English")
  const [selectedRow, setSelectedRow] = useState(0)
  const [cues, setCues] = useState<SubtitleCue[]>(demoCues)
  const [fileName, setFileName] = useState("")
  const [pageApiKey, setPageApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<StatusMessage | null>({ type: "exampleLoaded" })
  const [error, setError] = useState<ErrorMessage | null>(null)
  const messageText = message ? getStatusText(message, interfaceLanguage) : ""
  const errorText = error ? getErrorText(error, interfaceLanguage) : ""
  const [apiKeyShake, setApiKeyShake] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const apiKeyInputRef = useRef<HTMLInputElement>(null)
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
          targetLanguage: string
          selectedRow: number
          fileName: string
          cues: SubtitleCue[]
        }>
        if (parsed.interfaceLanguage && interfaceLanguages.includes(parsed.interfaceLanguage)) setInterfaceLanguage(parsed.interfaceLanguage)
        if (Array.isArray(parsed.cues) && parsed.cues.length > 0) setCues(parsed.cues.map(restoreCue))
        if (typeof parsed.targetLanguage === "string") setTargetLanguage(parsed.targetLanguage)
        if (typeof parsed.selectedRow === "number") setSelectedRow(Math.max(0, parsed.selectedRow))
        if (typeof parsed.fileName === "string") setFileName(parsed.fileName)
        setMessage({ type: "restored" })
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
      window.localStorage.setItem(storageKey, JSON.stringify({ interfaceLanguage, targetLanguage, selectedRow, fileName, cues }))
    } catch {
      setError({ type: "storage" })
    }
  }, [interfaceLanguage, targetLanguage, selectedRow, fileName, cues, hydrated])

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
      setError({ type: "invalidFile" })
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
        setError(null)
        setMessage({ type: "loaded", count: parsed.length })
      } catch (parseError) {
        setError({ type: "parseFile", extension })
      }
    }
    reader.onerror = () => setError({ type: "readFile" })
    reader.readAsText(file, "UTF-8")
  }
  function clearUploadedFile() {
    if (fileInputRef.current) fileInputRef.current.value = ""
    setCues(demoCues)
    setFileName("")
    setTargetLanguage("English")
    setSelectedRow(0)
    setError(null)
    setMessage({ type: "fileRemoved" })
  }
  async function translateSubtitles() {
    const apiKey = normalizePageApiKey(apiKeyInputRef.current?.value || pageApiKey)
    if (!apiKey) {
      setError({ type: "missingApiKey" })
      setMessage(null)
      setApiKeyShake(true)
      apiKeyInputRef.current?.focus()
      window.setTimeout(() => setApiKeyShake(false), 320)
      return
    }
    if (cues.length === 0) return

    setLoading(true)
    setError(null)
    try {
      const requestBody = {
        model: "deepseek-flash",
        messages: [
          {
            role: "system",
            content: `${translationPrompt}\n\nAdditional output requirements: Translate subtitle text into ${targetLanguage}. Return valid JSON only in the form {"translations":{"1":"...","2":"..."}}. The translations object must contain every numbered key from 1 through ${cues.length}, with exactly one translated string per key. Preserve the numbering order, do not add explanations, and preserve line breaks inside each subtitle when useful.`,
          },
          {
            role: "user",
            content: JSON.stringify(cues.map((cue, index) => ({ number: index + 1, text: cue.text }))),
          },
        ],
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        temperature: 0.2,
        stream: false,
      }
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(requestBody),
      })
      const payload = (await response.json()) as BrowserDeepSeekResponse
      if (response.status === 401) {
        setError({ type: "invalidApiKey" })
        setMessage(null)
        return
      }
      if (response.status === 402) {
        setError({ type: "insufficientBalance" })
        setMessage(null)
        return
      }
      if (response.status === 429) {
        setError({ type: "rateLimited" })
        setMessage(null)
        return
      }
      if (response.status >= 500) {
        setError({ type: "serviceUnavailable" })
        setMessage(null)
        return
      }
      if (!response.ok) {
        setError({ type: "invalidRequest", status: response.status })
        setMessage(null)
        return
      }
      const translations = parseBrowserTranslations(payload, cues.length)
      if (!translations) throw new Error("翻译失败")
      setCues((current) => current.map((cue, index) => ({ ...cue, translation: translations[index] ?? "", translations: { ...cue.translations, [targetLanguage]: translations[index] ?? "" } })))
      setMessage({ type: "translated", count: cues.length, language: targetLanguage })
    } catch (translateError) {
      setError({ type: "translation" })
      setMessage(null)
    } finally {
      setLoading(false)
    }
  }

  function handlePageApiKeyChange(value: string) {
    setPageApiKey(value)
    if (value.trim()) window.sessionStorage.setItem("subtitle-translate:page-api-key", value)
    else window.sessionStorage.removeItem("subtitle-translate:page-api-key")
    if (error?.type === "missingApiKey") setError(null)
    setApiKeyShake(false)
  }
  function downloadSubtitles() {
    if (!cues.some((cue) => getTranslation(cue, targetLanguage).trim())) {
      setError({ type: "noTranslation" })
      return
    }

    const isTxt = fileName.toLowerCase().endsWith(".txt")
    const content = isTxt
      ? `${cues.map((cue) => getTranslation(cue, targetLanguage) || cue.text).join("\n")}\n`
      : `${cues
          .map((cue) => `${cue.id}\n${cue.start} --> ${cue.end}\n${getTranslation(cue, targetLanguage) || cue.text}`)
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
      <StudyBackdrop hasError={Boolean(error)} />
      {(message || error) && <p role={error ? "alert" : "status"} className={cn("absolute left-[calc(57%+570px)] top-[64%] z-20 hidden max-w-[180px] rounded-[16px] border-2 border-[#202020] px-3 py-2 font-mono text-[11px] leading-relaxed shadow-[3px_4px_0_rgba(74,39,23,0.25)] min-[1400px]:block", error ? "bg-[#ffc5c7]" : "bg-[#fff4c7]/95")}>{error ? errorText : messageText}<span aria-hidden="true" className={cn("absolute -bottom-2 left-7 size-4 rotate-45 border-r-2 border-b-2 border-[#202020]", error ? "bg-[#ffc5c7]" : "bg-[#fff4c7]")} /></p>}
      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-3rem)] w-full max-w-[1120px] flex-col items-stretch sm:min-h-[680px]">
        <div className="relative z-20 mb-0 flex h-9 justify-end sm:pr-16">
          <div aria-label={uiText[interfaceLanguage].language} className="flex items-end gap-1">
            {interfaceLanguages.map((language, index) => <button key={language} type="button" aria-pressed={interfaceLanguage === language} title={language} onClick={() => setInterfaceLanguage(language)} className={cn("relative h-7 min-w-16 rounded-t-md border-2 border-b-0 border-[#d1aa79] px-2 font-mono text-[11px] font-bold text-[#59422f] shadow-[2px_-2px_4px_rgba(93,59,31,0.12)] transition-all hover:-translate-y-1 sm:min-w-20", interfaceLanguageTabColors[index], interfaceLanguage === language ? "z-10 h-9 -translate-y-0.5 brightness-110" : "opacity-80")}>{language}</button>)}
          </div>
        </div>

        <div className="notebook-spread relative flex w-full min-w-0 flex-1 flex-col overflow-visible rounded-[24px] border-[6px] border-[#4f2d2b] bg-[#6f3e35] p-2 shadow-[14px_18px_0_rgba(74,39,23,0.24)] sm:flex-none sm:flex-row sm:p-4">
          <NotebookPage title={uiText[interfaceLanguage].source} cues={cues} side="left" selectedRow={selectedRow} onSelect={setSelectedRow} scrollRef={sourceScrollRef} onScroll={() => syncScroll("source")} waitingText={uiText[interfaceLanguage].waiting} />
          <NotebookPage title={targetLanguage} cues={cues} side="right" selectedRow={selectedRow} onSelect={setSelectedRow} scrollRef={translationScrollRef} onScroll={() => syncScroll("translation")} onLanguageSelect={setTargetLanguage} translationLanguage={targetLanguage} waitingText={uiText[interfaceLanguage].waiting} />
          <NotebookBinding />
        </div>
        <div className="mt-3 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-[#202020] bg-[#fff4c7]/95 px-3 shadow-[2px_3px_0_rgba(32,32,32,0.3)]">
            <span className="shrink-0 font-mono text-xs font-semibold">{uiText[interfaceLanguage].apiKey}</span>
            <input ref={apiKeyInputRef} type="password" value={pageApiKey} onChange={(event) => handlePageApiKeyChange(event.currentTarget.value)} placeholder={uiText[interfaceLanguage].apiKeyPlaceholder} aria-label="页面 DeepSeek API Key" aria-invalid={error?.type === "missingApiKey"} className={cn("min-w-0 flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-[#202020]/45", apiKeyShake && "animate-api-key-shake")} />
            {pageApiKey && <span className="shrink-0 font-mono text-[10px] text-[#315d3b]">{uiText[interfaceLanguage].browserDirect}</span>}
          </label>
        </div>
        <div className="mt-5 mb-4 grid w-full gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border-2 border-[#202020] bg-[#f7dfb6]/90 px-3 shadow-[2px_3px_0_rgba(32,32,32,0.35)]">
            <label htmlFor="subtitle-file-input" className="flex shrink-0 cursor-pointer items-center">
              <input id="subtitle-file-input" ref={fileInputRef} type="file" accept=".srt,.txt,application/x-subrip,text/plain" onChange={handleFileChange} className="sr-only" />
              <span className="inline-flex h-7 items-center rounded-lg border-2 border-[#202020] bg-[#ffc5c7] px-3 font-mono text-sm font-semibold">{uiText[interfaceLanguage].upload}</span>
            </label>
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate font-mono text-xs sm:text-sm">{fileName || uiText[interfaceLanguage].chooseFile}</span>
              <button type="button" aria-label={uiText[interfaceLanguage].removeFile} title={uiText[interfaceLanguage].removeFile} onClick={clearUploadedFile} disabled={!fileName || loading} className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[#8b3f46] transition-colors hover:bg-[#ffc5c7] disabled:cursor-not-allowed disabled:opacity-40">
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
          <Button type="button" onClick={translateSubtitles} disabled={loading || cues.length === 0} className="h-10 justify-self-center rounded-lg border-2 border-[#202020] bg-[#b6efc0] px-5 font-mono text-sm font-semibold text-[#202020] shadow-[1px_2px_0_#202020] hover:bg-[#b6efc0]/85">
            {loading ? uiText[interfaceLanguage].translating : uiText[interfaceLanguage].translate}
          </Button>
          <Button type="button" onClick={downloadSubtitles} disabled={!cues.some((cue) => getTranslation(cue, targetLanguage).trim()) || loading} className="h-10 justify-self-stretch rounded-lg border-2 border-[#202020] bg-[#ffc5c7] px-5 font-mono text-sm font-semibold text-[#202020] shadow-[1px_2px_0_#202020] hover:bg-[#f5aeb5] sm:justify-self-end">
            {uiText[interfaceLanguage].download}
          </Button>
        </div>
        {(message || error) && <p role={error ? "alert" : "status"} className={cn("mb-3 w-full rounded-lg px-3 py-2 font-mono text-xs min-[1400px]:hidden", error ? "bg-[#ffc5c7]" : "bg-[#fff4c7]/90")}>{error ? errorText : messageText}</p>}
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
  if (!parsed || typeof parsed !== "object" || !("translations" in parsed)) {
    throw new Error("DeepSeek 返回的字幕格式不正确")
  }
  const translationsValue = parsed.translations
  const translationsObject = typeof translationsValue === "object" && translationsValue !== null && !Array.isArray(translationsValue)
    ? translationsValue as Record<string, unknown>
    : undefined
  const translations = Array.isArray(translationsValue)
    ? translationsValue
    : translationsObject
      ? Array.from({ length: expectedCount }, (_, index) => translationsObject[String(index + 1)])
      : undefined
  if (!translations || translations.length !== expectedCount || translations.some((translation) => typeof translation !== "string")) {
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

function StudyBackdrop({ hasError }: { hasError: boolean }) {
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
      <img src="desk-character.webp" alt="" data-role="normal-character" className={cn("absolute right-[1%] top-[60%] z-0 hidden w-[clamp(220px,22vw,300px)] rotate-[-4deg] drop-shadow-[8px_10px_0_rgba(74,39,23,0.2)] transition-opacity duration-500 ease-in-out xl:block", hasError ? "opacity-0" : "opacity-95")} />
      <img src="desk-character-error.webp" alt="" data-role="error-character" className={cn("absolute right-[1%] top-[60%] z-0 hidden w-[clamp(220px,22vw,300px)] rotate-[-4deg] drop-shadow-[8px_10px_0_rgba(74,39,23,0.2)] transition-opacity duration-500 ease-in-out xl:block", hasError ? "opacity-95" : "opacity-0")} />
      <div className="absolute right-[4%] top-[16%] hidden h-10 w-64 rotate-[14deg] rounded border-2 border-[#694127]/60 bg-[#f5d889]/75 shadow-[5px_7px_0_rgba(74,39,23,0.2)] sm:block lg:w-80">
        <div className="absolute inset-x-3 bottom-1 h-4 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_14px,#694127_15px,#694127_16px)] opacity-55" />
        <span className="absolute left-3 top-1 font-mono text-[9px] font-bold tracking-[0.2em] text-[#694127]/70">STUDY / 30 CM</span>
      </div>
      <div className="absolute left-[1%] top-[47%] hidden h-6 w-52 rotate-[-58deg] items-center drop-shadow-[5px_7px_0_rgba(74,39,23,0.2)] sm:flex lg:w-60">
        <div className="h-full w-8 rounded-l-md border-2 border-r-0 border-[#57321f] bg-[#e76f51]" />
        <div className="h-full flex-1 border-y-2 border-[#57321f] bg-[#f2c14e] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_5px,rgba(255,255,255,0.22)_6px)]" />
        <div className="h-0 w-0 border-y-[12px] border-l-[24px] border-y-transparent border-l-[#e8c69a]" />
        <div className="-ml-1 h-0 w-0 border-y-[4px] border-l-[8px] border-y-transparent border-l-[#27221f]" />
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


function NotebookPage({ title, cues, side, selectedRow, onSelect, scrollRef, onScroll, onLanguageSelect, translationLanguage, waitingText }: { title: string; cues: SubtitleCue[]; side: "left" | "right"; selectedRow: number; onSelect: (row: number) => void; scrollRef: React.RefObject<HTMLDivElement | null>; onScroll: () => void; onLanguageSelect?: (language: string) => void; translationLanguage?: string; waitingText: string }) {
  const isLeft = side === "left"
  const isGreekTranslation = !isLeft && (translationLanguage || title) === "Ελληνικά"
  return (
    <article className={cn("relative z-10 flex min-h-[520px] min-w-0 flex-1 flex-col border-2 border-[#a99579] bg-[#f8efd9] px-5 pb-5 pt-9 shadow-[inset_0_0_22px_rgba(134,94,47,0.08)] sm:h-[610px] sm:min-h-0 sm:px-10 sm:pt-12", isLeft ? "rounded-t-[18px] sm:rounded-l-[18px] sm:rounded-r-none" : "rounded-b-[18px] sm:rounded-l-none sm:rounded-r-[18px] sm:pl-12")}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-3 top-3 bottom-3 z-0 w-3 rounded-r-[12px] border-y-2 border-r-2 border-[#a99579] bg-[repeating-linear-gradient(0deg,#e1d1b2_0,#e1d1b2_3px,#cdbb9c_4px,#e1d1b2_5px)] shadow-[2px_3px_0_rgba(81,43,30,0.18)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-3 left-3 right-3 z-0 h-3 rounded-b-[12px] border-x-2 border-b-2 border-[#a99579] bg-[#d6c3a3] shadow-[2px_3px_0_rgba(81,43,30,0.18)]" />
      <div className="relative z-10 mb-3 flex items-center gap-3"><span className="font-mono text-[13px] font-semibold uppercase tracking-[0.22em] text-[#202020]/60">{title}</span><div className="flex-1 border-t-2 border-dotted border-[#202020]/80" /></div>
      <div ref={scrollRef} onScroll={onScroll} className="relative z-10 scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pr-1">
        {cues.map((cue, index) => <button key={cue.id} type="button" onClick={() => onSelect(index)} className={cn("flex min-h-[52px] w-full shrink-0 flex-col justify-center overflow-hidden border-b border-[#202020]/45 px-0.5 text-left font-mono leading-tight transition-colors", isGreekTranslation ? "text-[13px] sm:text-[14px]" : "text-[13px] sm:text-[15px]", selectedRow === index ? "bg-white/25" : "hover:bg-white/20")}><span className="mb-1 text-[10px] text-[#202020]/55">{cue.id}{cue.start && cue.end ? ` · ${cue.start} → ${cue.end}` : ""}</span><span className="whitespace-pre-wrap">{isLeft ? cue.text : getTranslation(cue, translationLanguage || title) || waitingText}</span></button>)}
      </div>
      {!isLeft && <LanguageBookmarks selected={title} onSelect={onLanguageSelect} />}
    </article>
  )
}

const languageBookmarkStyles = [
  { color: "bg-[#59b77d]", short: "EN" },
  { color: "bg-[#f6a6b8]", short: "中" },
  { color: "bg-[#69c78c]", short: "日" },
  { color: "bg-[#f0a148]", short: "한" },
  { color: "bg-[#ef8739]", short: "FR" },
  { color: "bg-[#df4050]", short: "DE" },
  { color: "bg-[#c93249]", short: "EL" },
] as const

function LanguageBookmarks({ selected, onSelect }: { selected: string; onSelect?: (language: string) => void }) {
  return <div aria-label="翻译语言" className="absolute right-1 top-24 z-30 flex w-[70px] -translate-y-1/2 flex-col gap-0.5 sm:-right-[86px] sm:top-1/2 sm:w-[86px] sm:translate-y-[-50%]">{languages.map((language, index) => { const bookmark = languageBookmarkStyles[index]!; const isSelected = selected === language; return <div key={language} className="group relative h-10 w-full shrink-0 sm:h-11"><span aria-hidden="true" className={cn("pointer-events-none absolute left-[14px] top-1/2 z-0 h-6 w-3 -translate-y-1/2 border-y-2 border-r-2 border-[#8b6047] sm:left-0", bookmark.color)} /><button type="button" aria-label={`选择${language}`} aria-pressed={isSelected} onClick={() => onSelect?.(language)} className={cn("absolute left-[14px] top-0 z-10 flex h-full w-14 items-center justify-center overflow-hidden rounded-r-[10px] border-2 border-l-0 border-[#8b6047] px-1 shadow-[2px_2px_0_rgba(81,43,30,0.25)] transition-transform duration-200 group-hover:translate-x-3 sm:left-0 sm:w-[62px] sm:rounded-r-[9px]", bookmark.color, isSelected && "translate-x-3 brightness-110 ring-2 ring-[#fff5c9] ring-offset-1 ring-offset-[#6f3e35]")}><span aria-hidden="true" className="font-mono text-[10px] font-bold tracking-tight text-white drop-shadow-[0_1px_1px_rgba(81,43,30,0.38)] sm:text-[11px]">{bookmark.short}</span><span className="sr-only">{language}</span></button></div> })}</div>
}


function NotebookBinding() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 h-8 -translate-y-1/2 sm:bottom-0 sm:left-1/2 sm:right-auto sm:top-0 sm:h-auto sm:w-12 sm:-translate-x-1/2 sm:translate-y-0">
      <div className="absolute inset-x-0 top-1/2 border-t-2 border-[#202020]/35 sm:inset-y-0 sm:inset-x-auto sm:left-1/2 sm:w-px sm:-translate-x-1/2 sm:border-l-2 sm:border-t-0 sm:border-[#202020]/25" />
      <div className="relative flex h-full w-full justify-around px-4 sm:flex-col sm:justify-between sm:px-0 sm:py-4">
        {Array.from({ length: 16 }, (_, index) => (
          <span key={index} className="relative flex h-full w-7 items-center justify-center sm:h-8 sm:w-full">
            <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full border border-[#6c5b4a] bg-[#47382f] shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_1px_1px_rgba(42,28,22,0.45)] sm:left-0 sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2" />
            <span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 rounded-full border border-[#6c5b4a] bg-[#47382f] shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_1px_1px_rgba(42,28,22,0.45)] sm:bottom-auto sm:left-auto sm:right-0 sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2" />
            <span className="relative z-10 h-7 w-4 rounded-full border-[3px] border-t-[#f5f6f3] border-r-[#687073] border-b-[#343a3c] border-l-[#b6bcbb] bg-transparent shadow-[0_1px_0_#f8f8f5,0_2px_2px_rgba(38,31,27,0.42)] sm:h-5 sm:w-10">
              <span className="absolute inset-[2px] rounded-full border border-[#f4f5f1]/70" />
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
