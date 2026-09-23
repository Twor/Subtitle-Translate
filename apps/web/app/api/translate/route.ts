const MAX_CUES = 200
const MAX_TEXT_LENGTH = 12000
const DEFAULT_TRANSLATION_PROMPT = "You are a professional subtitle translator. Translate naturally and accurately while preserving meaning, tone, character voice, cultural context, and subtitle readability. Do not translate proper nouns inconsistently."

type SubtitleRequest = {
  targetLanguage?: unknown
  cues?: unknown
}

function getTranslationPrompt(): string {
  return process.env.DEEPSEEK_TRANSLATION_PROMPT?.trim() || process.env.NEXT_PUBLIC_DEEPSEEK_TRANSLATION_PROMPT?.trim() || DEFAULT_TRANSLATION_PROMPT
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function getErrorMessage(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  return getString(value.message)
}

function getCompletionContent(value: unknown): string | undefined {
  if (!isRecord(value) || !Array.isArray(value.choices)) return undefined
  const firstChoice = value.choices[0]
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) return undefined
  return getString(firstChoice.message.content)
}

function getTranslations(value: unknown, expectedCount: number): unknown[] | undefined {
  if (!isRecord(value)) return undefined
  const translations = value.translations
  if (Array.isArray(translations)) return translations
  if (!isRecord(translations)) return undefined
  return Array.from({ length: expectedCount }, (_, index) => translations[String(index + 1)])
}

export async function POST(request: Request) {
  try {
    const requestBody: unknown = await request.json()
    const body: SubtitleRequest = isRecord(requestBody)
      ? requestBody
      : {}
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim() ?? ""
    const targetLanguage = getString(body.targetLanguage)?.trim() ?? ""
    const cues = Array.isArray(body.cues) ? body.cues : []

    if (!apiKey) {
      return Response.json(
        { error: "未配置 DEEPSEEK_API_KEY，请填写后重试" },
        { status: 500 },
      )
    }
    if (!targetLanguage) {
      return Response.json({ error: "请选择目标语言" }, { status: 400 })
    }
    if (cues.length === 0 || cues.length > MAX_CUES) {
      return Response.json(
        { error: `字幕条数必须在 1 到 ${MAX_CUES} 条之间` },
        { status: 400 },
      )
    }

    const sourceItems = cues.map((cue, index) => {
      if (!isRecord(cue)) {
        throw new Error(`第 ${index + 1} 条字幕格式无效`)
      }
      const text = getString(cue.text)?.trim() ?? ""
      if (!text) {
        throw new Error(`第 ${index + 1} 条字幕没有文本`)
      }
      return { number: index + 1, text }
    })
    const sourceText = JSON.stringify(sourceItems)
    if (sourceText.length > MAX_TEXT_LENGTH) {
      return Response.json({ error: "字幕内容过长，请分段翻译" }, { status: 400 })
    }

    const deepSeekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-flash",
        messages: [
          {
            role: "system",
            content: `${getTranslationPrompt()}\n\nAdditional output requirements: Translate subtitle text into ${targetLanguage}. Return valid JSON only in the form {"translations":{"1":"...","2":"..."}}. The translations object must contain every numbered key from 1 through ${cues.length}, with exactly one translated string per key. Preserve the numbering order, do not add explanations, and preserve line breaks inside each subtitle when useful.`,
          },
          { role: "user", content: sourceText },
        ],
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        temperature: 0.2,
        stream: false,
      }),
    })

    const payload: unknown = await deepSeekResponse.json()
    if (!deepSeekResponse.ok) {
      return Response.json(
        { error: getErrorMessage(isRecord(payload) ? payload.error : undefined) || "DeepSeek 翻译请求失败" },
        { status: deepSeekResponse.status >= 500 ? 502 : 400 },
      )
    }

    const content = getCompletionContent(payload)
    if (!content) {
      return Response.json({ error: "DeepSeek 没有返回翻译结果" }, { status: 502 })
    }

    const translations = getTranslations(JSON.parse(content), cues.length)
    if (
      !translations ||
      translations.length !== cues.length ||
      translations.some((translation) => typeof translation !== "string")
    ) {
      return Response.json({ error: "DeepSeek 返回的字幕数量不正确" }, { status: 502 })
    }

    return Response.json({ translations })
  } catch (error) {
    const message = error instanceof Error ? error.message : "翻译请求失败"
    return Response.json({ error: message }, { status: 400 })
  }
}
