import { isPrivateOrInternalHost } from '@/lib/launch-kit/url-safety'

type JsonRecord = Record<string, unknown>

type ReplicatePrediction = {
  id: string
  status: ReplicatePredictionStatus
  error?: string | null
  output?: unknown
  urls?: {
    get?: string
    web?: string
  }
}

export type ReplicatePredictionResult = {
  id: string
  status: ReplicatePrediction['status']
  output: unknown
  outputUrl: string
  error: string
  webUrl: string
  getUrl: string
}

type RunReplicateStructuredInput = {
  instructions: string
  prompt: string
  jsonSchema?: JsonRecord
  schemaName?: string
  modelVariant?: string
  maxOutputTokens?: number
  pollTimeoutMs?: number
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high'
  verbosity?: 'low' | 'medium' | 'high'
}

type RunReplicatePredictionInput = {
  model: string
  input: JsonRecord
  waitSeconds?: number
  pollTimeoutMs?: number
  cancelAfter?: string
}

const DEFAULT_MODEL = 'openai/gpt-5-structured'
const PREDICTION_STATUSES = new Set(['starting', 'processing', 'succeeded', 'failed', 'canceled'])
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled'])
const REPLICATE_API_ORIGIN = 'https://api.replicate.com'
const REPLICATE_WEB_ORIGIN = 'https://replicate.com'
const DEBUG = process.env.REPLICATE_DEBUG === '1'

type ReplicatePredictionStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'

export function hasReplicateToken(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN)
}

export async function runReplicateStructured<T>(
  input: RunReplicateStructuredInput,
): Promise<T | null> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return null
  }

  const model = process.env.REPLICATE_MODEL || DEFAULT_MODEL
  const endpoint = `https://api.replicate.com/v1/models/${model}/predictions`
  const structuredSchema = input.jsonSchema
    ? {
        format: {
          type: 'json_schema',
          name: input.schemaName || 'structured_output',
          schema: input.jsonSchema,
        },
      }
    : undefined

  const createResponse = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      // Ask Replicate to hold the request open while the prediction runs.
      prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: {
        instructions: input.instructions,
        prompt: input.prompt,
        model: input.modelVariant || process.env.REPLICATE_OPENAI_MODEL || 'gpt-5',
        reasoning_effort: input.reasoningEffort || 'high',
        verbosity: input.verbosity || 'high',
        max_output_tokens: input.maxOutputTokens || 3200,
        ...(structuredSchema ? { json_schema: structuredSchema } : {}),
      },
    }),
    signal: AbortSignal.timeout(120000),
  })

  if (!createResponse.ok) {
    if (DEBUG) {
      console.warn('[replicate] create failed', createResponse.status, await createResponse.text())
    }
    return null
  }

  const createdPrediction = normalizeReplicatePrediction(await readResponseJson(createResponse))
  if (!createdPrediction) {
    return null
  }

  let prediction = createdPrediction
  if (DEBUG) {
    console.info('[replicate] initial status', prediction?.status, 'id', prediction?.id)
  }
  if (!prediction || !prediction.id) {
    return null
  }

  const pollDeadline = Date.now() + (input.pollTimeoutMs || 360000)
  while (!TERMINAL_STATUSES.has(prediction.status) && Date.now() < pollDeadline) {
    const getUrl = getReplicatePollUrl(prediction)
    const statusResponse = await fetch(getUrl, {
      headers: {
        authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(60000),
    })

    if (!statusResponse.ok) {
      if (DEBUG) {
        console.warn('[replicate] poll failed', statusResponse.status, await statusResponse.text())
      }
      return null
    }

    const nextPrediction = normalizeReplicatePrediction(await readResponseJson(statusResponse))
    if (!nextPrediction) {
      return null
    }

    prediction = nextPrediction

    if (!TERMINAL_STATUSES.has(prediction.status)) {
      await sleep(2000)
    }
  }

  if (prediction.status !== 'succeeded') {
    if (DEBUG) {
      console.warn('[replicate] terminal non-success', prediction.status, prediction.error)
    }
    return null
  }

  const parsed = parseReplicateOutput<T>(prediction.output)
  if (DEBUG) {
    console.info('[replicate] parsed', parsed ? 'ok' : 'null')
  }
  return parsed
}

export async function runReplicatePrediction(
  input: RunReplicatePredictionInput,
): Promise<ReplicatePredictionResult | null> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return null
  }

  const prediction = await createReplicatePrediction({
    model: input.model,
    input: input.input,
    waitSeconds: input.waitSeconds ?? 5,
    cancelAfter: input.cancelAfter,
  })

  if (!prediction?.id) {
    return null
  }

  const finalPrediction = await pollReplicatePrediction(
    prediction,
    input.pollTimeoutMs ?? 480000,
  )

  return {
    id: finalPrediction.id,
    status: finalPrediction.status,
    output: finalPrediction.output,
    outputUrl: extractReplicateOutputUrl(finalPrediction.output),
    error: finalPrediction.error || '',
    webUrl: finalPrediction.urls?.web || `https://replicate.com/p/${finalPrediction.id}`,
    getUrl: finalPrediction.urls?.get || `https://api.replicate.com/v1/predictions/${finalPrediction.id}`,
  }
}

async function createReplicatePrediction(input: {
  model: string
  input: JsonRecord
  waitSeconds: number
  cancelAfter?: string
}): Promise<ReplicatePrediction | null> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return null
  }

  const response = await fetch(`https://api.replicate.com/v1/models/${input.model}/predictions`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      prefer: `wait=${input.waitSeconds}`,
      ...(input.cancelAfter ? { 'cancel-after': input.cancelAfter } : {}),
    },
    body: JSON.stringify({ input: input.input }),
    signal: AbortSignal.timeout(120000),
  })

  if (!response.ok) {
    if (DEBUG) {
      console.warn('[replicate] prediction create failed', response.status, await response.text())
    }
    return null
  }

  return normalizeReplicatePrediction(await readResponseJson(response))
}

async function pollReplicatePrediction(
  initialPrediction: ReplicatePrediction,
  pollTimeoutMs: number,
): Promise<ReplicatePrediction> {
  let prediction = initialPrediction
  const pollDeadline = Date.now() + pollTimeoutMs

  while (!TERMINAL_STATUSES.has(prediction.status) && Date.now() < pollDeadline) {
    const getUrl = getReplicatePollUrl(prediction)
    const statusResponse = await fetch(getUrl, {
      headers: {
        authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      },
      signal: AbortSignal.timeout(60000),
    })

    if (!statusResponse.ok) {
      if (DEBUG) {
        console.warn('[replicate] prediction poll failed', statusResponse.status, await statusResponse.text())
      }
      return {
        ...prediction,
        status: 'failed',
        error: `Replicate poll failed with ${statusResponse.status}`,
      }
    }

    const nextPrediction = normalizeReplicatePrediction(await readResponseJson(statusResponse))
    if (!nextPrediction) {
      return {
        ...prediction,
        status: 'failed',
        error: 'Replicate poll returned an invalid prediction',
      }
    }

    prediction = nextPrediction

    if (!TERMINAL_STATUSES.has(prediction.status)) {
      await sleep(2000)
    }
  }

  if (!TERMINAL_STATUSES.has(prediction.status)) {
    return {
      ...prediction,
      status: 'failed',
      error: 'Replicate prediction timed out',
    }
  }

  return prediction
}

function extractReplicateOutputUrl(output: unknown): string {
  if (typeof output === 'string') {
    return normalizePublicAssetUrl(output)
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const url = extractReplicateOutputUrl(item)
      if (url) {
        return url
      }
    }
    return ''
  }

  if (output && typeof output === 'object') {
    const record = output as Record<string, unknown>
    const directUrl = record.url || record.uri || record.path || record.download_url
    if (typeof directUrl === 'string') {
      const url = normalizePublicAssetUrl(directUrl)
      if (url) {
        return url
      }
    }

    for (const key of ['output', 'video', 'image', 'images', 'videos', 'files']) {
      const url = extractReplicateOutputUrl(record[key])
      if (url) {
        return url
      }
    }
  }

  return ''
}

function parseReplicateOutput<T>(output: unknown): T | null {
  if (output === null || output === undefined) {
    return null
  }

  if (typeof output === 'string') {
    const direct = safeJsonParse<T>(output)
    if (direct) {
      return direct
    }
    return null
  }

  if (Array.isArray(output)) {
    const text = output.filter((item) => typeof item === 'string').join('')
    if (!text) {
      return null
    }
    return safeJsonParse<T>(text)
  }

  if (typeof output === 'object') {
    const maybeEnvelope = output as {
      json_output?: unknown
      text?: unknown
    }

    if (maybeEnvelope.json_output && typeof maybeEnvelope.json_output === 'object') {
      return maybeEnvelope.json_output as T
    }

    if (typeof maybeEnvelope.text === 'string') {
      const parsedText = safeJsonParse<T>(maybeEnvelope.text)
      if (parsedText) {
        return parsedText
      }
    }

    if (Object.keys(output as Record<string, unknown>).length === 0) {
      return null
    }

    return output as T
  }

  return null
}

async function readResponseJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function normalizeReplicatePrediction(value: unknown): ReplicatePrediction | null {
  if (!isRecord(value)) {
    return null
  }

  const id = typeof value.id === 'string' ? value.id.trim() : ''
  const status = typeof value.status === 'string' ? value.status.trim() : ''

  if (!id || !isReplicatePredictionStatus(status)) {
    return null
  }

  const prediction: ReplicatePrediction = {
    id,
    status,
    error:
      typeof value.error === 'string' || value.error === null || value.error === undefined
        ? value.error
        : 'Replicate returned a non-string error payload',
    output: value.output,
    urls: {
      get: normalizeReplicateApiUrl(isRecord(value.urls) ? value.urls.get : undefined, id),
      web: normalizeReplicateWebUrl(isRecord(value.urls) ? value.urls.web : undefined, id),
    },
  }

  return prediction
}

function isReplicatePredictionStatus(value: string): value is ReplicatePredictionStatus {
  return PREDICTION_STATUSES.has(value)
}

function getReplicatePollUrl(prediction: ReplicatePrediction): string {
  return normalizeReplicateApiUrl(prediction.urls?.get, prediction.id)
}

function normalizeReplicateApiUrl(value: unknown, predictionId: string): string {
  const fallback = `${REPLICATE_API_ORIGIN}/v1/predictions/${encodeURIComponent(predictionId)}`
  if (typeof value !== 'string') {
    return fallback
  }

  try {
    const url = new URL(value)
    if (url.origin !== REPLICATE_API_ORIGIN || !url.pathname.startsWith('/v1/')) {
      return fallback
    }
    url.hash = ''
    return url.toString()
  } catch {
    return fallback
  }
}

function normalizeReplicateWebUrl(value: unknown, predictionId: string): string {
  const fallback = `${REPLICATE_WEB_ORIGIN}/p/${encodeURIComponent(predictionId)}`
  if (typeof value !== 'string') {
    return fallback
  }

  try {
    const url = new URL(value)
    if (url.origin !== REPLICATE_WEB_ORIGIN || !url.pathname.startsWith('/p/')) {
      return fallback
    }
    url.hash = ''
    return url.toString()
  } catch {
    return fallback
  }
}

function normalizePublicAssetUrl(value: string): string {
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:' ||
      isPrivateOrInternalHost(url.hostname.replace(/^\[|\]$/g, ''))
    ) {
      return ''
    }
    url.hash = ''
    return url.toString()
  } catch {
    return ''
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
