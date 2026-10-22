export type Scenario = 'delivery' | 'neighbor' | 'stranger'
export type ActionId = 'coming' | 'leave_at_door' | 'not_now'

export interface Analysis {
  visitor_type: 'delivery' | 'neighbor' | 'stranger' | 'unknown'
  description: string
  carrying: 'package' | 'nothing' | 'unclear'
  risk: 'low' | 'medium' | 'high'
  risk_reason: string
  suggested_action: ActionId
}

export interface RingEvent {
  id: string
  time: string
  scenario: Scenario | 'photo'
  analysis: Analysis
  source: 'gemini' | 'mock'
  image: string | null
  action: ActionId | null
  actionTime: string | null
}

export const MOCK_ANALYSES: Record<Scenario, Analysis> = {
  delivery: {
    visitor_type: 'delivery',
    description: 'A delivery person in uniform is holding a package.',
    carrying: 'package',
    risk: 'low',
    risk_reason: '',
    suggested_action: 'leave_at_door',
  },
  neighbor: {
    visitor_type: 'neighbor',
    description: 'A friendly person is waving at the camera with empty hands.',
    carrying: 'nothing',
    risk: 'low',
    risk_reason: '',
    suggested_action: 'coming',
  },
  stranger: {
    visitor_type: 'stranger',
    description: 'An unknown person is standing close to the door and looking around.',
    carrying: 'unclear',
    risk: 'high',
    risk_reason: 'Unknown person, no uniform, face partly covered.',
    suggested_action: 'not_now',
  },
}

export const ACTIONS: Record<ActionId, { label: string; doorMessage: string }> = {
  coming: { label: 'Coming', doorMessage: 'I am coming. Please wait a moment.' },
  leave_at_door: {
    label: 'Leave at door',
    doorMessage: 'Please leave the package at the door. Thank you!',
  },
  not_now: {
    label: 'Not now',
    doorMessage: 'Sorry, I cannot come to the door right now.',
  },
}

export function isScenario(value: unknown): value is Scenario {
  return value === 'delivery' || value === 'neighbor' || value === 'stranger'
}

export function isActionId(value: unknown): value is ActionId {
  return value === 'coming' || value === 'leave_at_door' || value === 'not_now'
}

interface Store {
  current: RingEvent | null
  log: RingEvent[]
}

const g = globalThis as unknown as { __seebell?: Store }

export function getStore(): Store {
  if (!g.__seebell) {
    g.__seebell = { current: null, log: [] }
  }
  return g.__seebell
}
