import { pluginUi } from '../../lib/plugin-font.js'
import {
  featureEmoji,
  getGroupFeatureDefinition,
  groupFeatureDefinitions,
  setGroupFeature
} from '../../lib/group-features.js'
import { definePlugin } from '../../lib/plugin-utils.js'
import { ensureGroupState, markDatabaseDirty } from '../../lib/group-state.js'

const enabledValues = new Set(['on', '1', 'true', 'attiva', 'attivo', 'abilita'])
const disabledValues = new Set(['off', '0', 'false', 'disattiva', 'disattivo', 'disabilita'])

function normalizeFeatureState(value) {
  const normalized = String(value || '').toLowerCase()
  if (enabledValues.has(normalized)) return true
  if (disabledValues.has(normalized)) return false
  return null
}

function syncGlobalFeature(conn, definition, enabled) {
  if (!['antiCall', 'sologruppo'].includes(definition.key)) return
  const settingsKey = conn.user?.jid
  if (!settingsKey) return
  const settings = global.db.data.settings[settingsKey] || (global.db.data.settings[settingsKey] = {})
  settings[definition.key] = enabled
}

function renderStatus(chat, definitions) {
  return definitions.map(definition => pluginUi.row(
    featureEmoji(chat, definition),
    definition.label,
    `(.${definition.command} on/off)`
  ))
}

async function featureToggle(m, extra) {
  const chat = ensureGroupState(global.db.data.chats[m.chat] || (global.db.data.chats[m.chat] = {}))
  const args = String(extra.text || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
  const shortcutState = ['on', 'off'].includes(extra.command) ? extra.command : null
  const shortcutArgs = shortcutState && args[0] === 'funzione' ? args.slice(1) : args
  const requested = shortcutArgs[0]
  const state = shortcutState ? shortcutState === 'on' : normalizeFeatureState(shortcutArgs[1])
  if (!requested) {
    return m.reply(pluginUi.box('🧩 Funzioni', renderStatus(chat, groupFeatureDefinitions)))
  }

  if (['all', 'tutti', 'tutte'].includes(requested)) {
    if (state === null) {
      return m.reply(pluginUi.box('⚠️ Funzioni', [
        pluginUi.row('ℹ️', 'Uso:', '.on tutti oppure .off tutti')
      ]))
    }
    for (const definition of groupFeatureDefinitions) {
      setGroupFeature(chat, definition.key, state)
      syncGlobalFeature(this, definition, state)
    }
    markDatabaseDirty()
    return m.reply(pluginUi.box('🧩 Funzioni', [
      pluginUi.row(state ? '✅' : '❌', 'Stato:', state ? 'tutte le funzioni attivate' : 'tutte le funzioni disattivate')
    ]))
  }

  const definition = getGroupFeatureDefinition(requested)
  if (!definition) {
    return m.reply(pluginUi.box('⚠️ Funzioni', [
      pluginUi.row('❓', 'Funzione:', 'nome non riconosciuto'),
      pluginUi.row('ℹ️', 'Menu:', '.menu-funzioni')
    ]))
  }
  if (state === null) {
    return m.reply(pluginUi.box('⚠️ Funzioni', [
      pluginUi.row(featureEmoji(chat, definition), 'Stato:', `${definition.label} è ${featureEmoji(chat, definition) === '✅' ? 'attiva' : 'disattiva'}`),
      pluginUi.row('ℹ️', 'Uso:', `.on ${definition.command} oppure .off ${definition.command}`)
    ]))
  }

  setGroupFeature(chat, definition.key, state)
  syncGlobalFeature(this, definition, state)
  markDatabaseDirty()
  return m.reply(pluginUi.box('🧩 Funzioni', [
    pluginUi.row(state ? '✅' : '❌', 'Stato:', `${definition.label} ${state ? 'attivata' : 'disattivata'}`),
    pluginUi.row('ℹ️', 'Comando:', `.${state ? 'off' : 'on'} ${definition.command}`)
  ]))
}

export default definePlugin(featureToggle, {
  name: 'group-feature-toggle',
  command: ['funzione', 'funzioni', 'togglefunzione', 'on', 'off'],
  category: 'features',
  target: 'group',
  roles: ['admin', 'owner'],
  description: 'Attiva o disattiva le funzioni avanzate del gruppo',
  icon: '🧩',
  order: 5,
  menu: true,
  permissions: { roles: ['admin', 'owner'] }
}, { group: true })
