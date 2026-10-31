import axios from 'axios'
import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const WEATHER_TIMEOUT = 12000
const WEATHER_COOLDOWN = 8000
const WEATHER_MAX_CITY_LENGTH = 80
const requests = new Map()

function formatTemperature(value) {
  const number = Number(value)
  return Number.isFinite(number) ? `${Math.round(number)}°C` : 'N/D'
}

function formatWind(value) {
  const number = Number(value)
  return Number.isFinite(number) ? `${Math.round(number)} km/h` : 'N/D'
}

function getCooldownKey(m) {
  return `${m.chat}:${m.sender}`
}

function isRateLimited(m) {
  const key = getCooldownKey(m)
  const expiresAt = requests.get(key) || 0
  const now = Date.now()
  if (expiresAt > now) return Math.ceil((expiresAt - now) / 1000)
  requests.set(key, now + WEATHER_COOLDOWN)
  setTimeout(() => {
    if ((requests.get(key) || 0) <= Date.now()) requests.delete(key)
  }, WEATHER_COOLDOWN)
  return 0
}

function weatherIcon(code) {
  const value = Number(code)
  if (value === 113) return '☀️'
  if ([116, 119, 122].includes(value)) return '⛅'
  if ([143, 248, 260].includes(value)) return '🌫️'
  if ([176, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(value)) return '🌧️'
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371].includes(value)) return '❄️'
  if ([200, 386, 389, 392, 395].includes(value)) return '⛈️'
  return '🌤️'
}

function describeCurrent(current) {
  const description = current.weatherDesc?.[0]?.value || 'Condizioni non disponibili'
  return [
    pluginUi.row(weatherIcon(current.weatherCode), 'Condizioni:', description),
    pluginUi.row('🌡️', 'Temperatura:', formatTemperature(current.temp_C)),
    pluginUi.row('🤝', 'Percepita:', formatTemperature(current.FeelsLikeC)),
    pluginUi.row('💧', 'Umidità:', `${current.humidity || 'N/D'}%`),
    pluginUi.row('💨', 'Vento:', formatWind(current.windspeedKmph))
  ]
}

function describeForecast(days) {
  return days.slice(0, 3).map(day => {
    const date = new Date(`${day.date}T12:00:00`).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' })
    const rain = Number(day.hourly?.reduce((total, hour) => total + Number(hour.chanceofrain || 0), 0) / Math.max(day.hourly?.length || 1, 1))
    const rainText = Number.isFinite(rain) ? `${Math.round(rain)}% pioggia` : 'pioggia N/D'
    return pluginUi.row(weatherIcon(day.hourly?.[4]?.weatherCode), date, `${formatTemperature(day.mintempC)} / ${formatTemperature(day.maxtempC)} · ${rainText}`)
  })
}

async function weather(m, { text, usedPrefix, command }) {
  const city = String(text || '').trim()
  if (!city) {
    return m.reply(pluginUi.box('🌤️ Meteo', [
      pluginUi.row('ℹ️', 'Uso:', `${usedPrefix}${command} <città>`),
      pluginUi.row('✨', 'Esempio:', `${usedPrefix}${command} Milano`)
    ]))
  }

  if (city.length > WEATHER_MAX_CITY_LENGTH) {
    return m.reply(pluginUi.box('⚠️ Meteo', [pluginUi.row('🚫', 'Limite:', `${WEATHER_MAX_CITY_LENGTH} caratteri massimi`)]))
  }

  const remaining = isRateLimited(m)
  if (remaining) {
    return m.reply(pluginUi.box('⏱️ Meteo', [pluginUi.row('🕒', 'Attendi:', `${remaining} secondi prima di una nuova richiesta`)]))
  }

  try {
    const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}`, {
      params: { format: 'j1' },
      timeout: WEATHER_TIMEOUT,
      headers: { 'User-Agent': 'ChatBridge-Bot/14.0' }
    })
    const data = response.data
    const area = data.nearest_area?.[0] || {}
    const current = data.current_condition?.[0]
    if (!current) throw new Error('Dati meteo non disponibili')

    const location = [area.areaName?.[0]?.value, area.country?.[0]?.value].filter(Boolean).join(', ') || city
    const rows = [
      pluginUi.row('📍', 'Luogo:', location),
      ...describeCurrent(current),
      pluginUi.row('📅', 'Aggiornato:', current.localObsDateTime || 'ora locale')
    ]
    const forecast = describeForecast(data.weather || [])
    if (forecast.length) rows.push(...forecast)
    return m.reply(pluginUi.box('🌤️ Meteo', rows))
  } catch (error) {
    console.error('[tools-weather]', error)
    return m.reply(pluginUi.box('⚠️ Meteo', [
      pluginUi.row('🚫', 'Stato:', 'Città non trovata o servizio temporaneamente non disponibile')
    ]))
  }
}

export default definePlugin(weather, {
  name: 'tools-weather',
  command: ['meteo', 'weather'],
  category: 'tools',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Mostra condizioni attuali e previsioni per una città',
  icon: '🌤️',
  order: 4,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
