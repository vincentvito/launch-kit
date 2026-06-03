export type SampleChannel = {
  id: string
  label: string
  eyebrow: string
  title: string
  body: string
  cta: string
  notes: string
}

export type SampleSubreddit = {
  name: string
  angle: string
  guidance: string
}

export type SampleSeoPlan = {
  title: string
  intent: string
  angle: string
}

export type SampleOutreach = {
  title: string
  body: string
  cta: string
}

export type SampleProspect = {
  name: string
  segment: string
  fit: string
  outreachAngle: string
}

export type SampleProductDemo = {
  title: string
  format: string
  draft: string
}

export type SampleCreativeAsset = {
  id: string
  title: string
  label: string
  format: string
  prompt: string
}

export type SampleBriefSignal = {
  label: string
  value: string
}

export type SampleMediaKit = {
  oneLiner: string
  boilerplate: string
  pressHook: string
}

export type WaitingListSampleData = {
  briefSignals: SampleBriefSignal[]
  channels: SampleChannel[]
  subreddits: SampleSubreddit[]
  seoPlan: SampleSeoPlan[]
  outreach: SampleOutreach[]
  prospects: SampleProspect[]
  productDemo: SampleProductDemo[]
  creativeAssets: SampleCreativeAsset[]
  mediaKit: SampleMediaKit
}

type RecordValue = Record<string, unknown>

const EMPTY_MEDIA_KIT: SampleMediaKit = {
  oneLiner: '',
  boilerplate: '',
  pressHook: '',
}

export function readWaitingListSampleData(value: unknown): WaitingListSampleData {
  const source = isRecord(value) ? value : {}

  return {
    briefSignals: readArray(source.briefSignals, readBriefSignal),
    channels: readArray(source.channels, readChannel),
    subreddits: readArray(source.subreddits, readSubreddit),
    seoPlan: readArray(source.seoPlan, readSeoPlan),
    outreach: readArray(source.outreach, readOutreach),
    prospects: readArray(source.prospects, readProspect),
    productDemo: readArray(source.productDemo, readProductDemo),
    creativeAssets: readArray(source.creativeAssets, readCreativeAsset),
    mediaKit: readMediaKit(source.mediaKit),
  }
}

function readArray<T>(value: unknown, reader: (value: unknown) => T | null): T[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const parsed = reader(item)
    return parsed ? [parsed] : []
  })
}

function readBriefSignal(value: unknown): SampleBriefSignal | null {
  const source = recordOrNull(value)
  if (!source) {
    return null
  }

  return {
    label: readString(source.label),
    value: readString(source.value),
  }
}

function readChannel(value: unknown): SampleChannel | null {
  const source = recordOrNull(value)
  if (!source) {
    return null
  }

  return {
    id: readString(source.id),
    label: readString(source.label),
    eyebrow: readString(source.eyebrow),
    title: readString(source.title),
    body: readString(source.body),
    cta: readString(source.cta),
    notes: readString(source.notes),
  }
}

function readSubreddit(value: unknown): SampleSubreddit | null {
  const source = recordOrNull(value)
  if (!source) {
    return null
  }

  return {
    name: readString(source.name),
    angle: readString(source.angle),
    guidance: readString(source.guidance),
  }
}

function readSeoPlan(value: unknown): SampleSeoPlan | null {
  const source = recordOrNull(value)
  if (!source) {
    return null
  }

  return {
    title: readString(source.title),
    intent: readString(source.intent),
    angle: readString(source.angle),
  }
}

function readOutreach(value: unknown): SampleOutreach | null {
  const source = recordOrNull(value)
  if (!source) {
    return null
  }

  return {
    title: readString(source.title),
    body: readString(source.body),
    cta: readString(source.cta),
  }
}

function readProspect(value: unknown): SampleProspect | null {
  const source = recordOrNull(value)
  if (!source) {
    return null
  }

  return {
    name: readString(source.name),
    segment: readString(source.segment),
    fit: readString(source.fit),
    outreachAngle: readString(source.outreachAngle),
  }
}

function readProductDemo(value: unknown): SampleProductDemo | null {
  const source = recordOrNull(value)
  if (!source) {
    return null
  }

  return {
    title: readString(source.title),
    format: readString(source.format),
    draft: readString(source.draft),
  }
}

function readCreativeAsset(value: unknown): SampleCreativeAsset | null {
  const source = recordOrNull(value)
  if (!source) {
    return null
  }

  return {
    id: readString(source.id),
    title: readString(source.title),
    label: readString(source.label),
    format: readString(source.format),
    prompt: readString(source.prompt),
  }
}

function readMediaKit(value: unknown): SampleMediaKit {
  const source = recordOrNull(value)
  if (!source) {
    return EMPTY_MEDIA_KIT
  }

  return {
    oneLiner: readString(source.oneLiner),
    boilerplate: readString(source.boilerplate),
    pressHook: readString(source.pressHook),
  }
}

function recordOrNull(value: unknown): RecordValue | null {
  return isRecord(value) ? value : null
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
