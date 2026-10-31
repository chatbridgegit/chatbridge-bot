import { EventEmitter } from 'events'
import { rm } from 'fs/promises'
import { useMultiFileAuthState } from '@chatbridgeworld/baileys'

export function makeConnectionManager({ auth = {}, reconnect = {} } = {}) {
  const authFolder = auth.options?.folder || 'sessioni'
  let reconnectAttempts = 0
  let reconnectSuccesses = 0
  let reconnectFailures = 0
  let healthMonitorRunning = false
  const rateStats = { successes: 0, errors: 0, lastErrorAt: null }
  const metricCounts = new Map()
  const metricDurations = new Map()

  const subsystems = {
    authManager: {
      load: () => useMultiFileAuthState(authFolder),
      clear: () => rm(authFolder, { recursive: true, force: true })
    },
    eventBus: new EventEmitter(),
    rateLimiter: {
      reportError() {
        rateStats.errors++
        rateStats.lastErrorAt = Date.now()
      },
      reportSuccess() {
        rateStats.successes++
      },
      get status() {
        return { ...rateStats }
      }
    },
    metrics: {
      startTimer(name) {
        const startedAt = Date.now()
        return () => {
          const durations = metricDurations.get(name) || []
          durations.push(Date.now() - startedAt)
          if (durations.length > 1000) durations.shift()
          metricDurations.set(name, durations)
        }
      },
      increment(name) {
        metricCounts.set(name, (metricCounts.get(name) || 0) + 1)
      },
      snapshot() {
        return {
          counts: Object.fromEntries(metricCounts),
          durations: Object.fromEntries([...metricDurations].map(([name, values]) => [
            name,
            {
              count: values.length,
              averageMs: values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0
            }
          ]))
        }
      }
    },
    reconnect: {
      reset() {
        reconnectAttempts = 0
      },
      evaluate(error) {
        const statusCode = error?.output?.statusCode || error?.output?.payload?.statusCode
        const permanent = [401, 440, 500].includes(statusCode)
        if (permanent) return { shouldReconnect: false, delayMs: 0, reason: `disconnect-${statusCode}` }
        if (reconnectAttempts >= (reconnect.maxAttempts ?? 4)) {
          return { shouldReconnect: false, delayMs: 0, reason: 'retry-limit-reached' }
        }
        const delayMs = Math.min(
          (reconnect.initialDelayMs ?? 8000) * (2 ** reconnectAttempts),
          reconnect.maxDelayMs ?? 30000
        )
        reconnectAttempts++
        return { shouldReconnect: true, delayMs, reason: error?.message || 'transient-disconnect' }
      },
      wait: delayMs => new Promise(resolve => setTimeout(resolve, delayMs)),
      recordSuccess() {
        reconnectSuccesses++
      },
      recordFailure() {
        reconnectFailures++
      },
      get status() {
        return { attempts: reconnectAttempts, successes: reconnectSuccesses, failures: reconnectFailures }
      }
    },
    healthMonitor: {
      start() {
        healthMonitorRunning = true
      },
      stop() {
        healthMonitorRunning = false
      },
      get isRunning() {
        return healthMonitorRunning
      }
    }
  }

  return { subsystems }
}
