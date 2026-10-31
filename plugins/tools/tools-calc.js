import { definePlugin } from '../../lib/plugin-utils.js'
import { pluginUi } from '../../lib/plugin-font.js'

const MAX_EXPRESSION_LENGTH = 180
const MAX_ABSOLUTE_RESULT = 1e100

const functions = {
  abs: value => Math.abs(value),
  ceil: value => Math.ceil(value),
  cos: value => Math.cos(value),
  floor: value => Math.floor(value),
  ln: value => Math.log(value),
  log: value => Math.log10(value),
  round: value => Math.round(value),
  sin: value => Math.sin(value),
  sqrt: value => Math.sqrt(value),
  tan: value => Math.tan(value)
}

function tokenize(expression) {
  const tokens = []
  let cursor = 0
  while (cursor < expression.length) {
    const chunk = expression.slice(cursor)
    const whitespace = chunk.match(/^\s+/)
    if (whitespace) {
      cursor += whitespace[0].length
      continue
    }
    const number = chunk.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i)
    if (number) {
      tokens.push({ type: 'number', value: Number(number[0]) })
      cursor += number[0].length
      continue
    }
    const identifier = chunk.match(/^[a-z]+/i)
    if (identifier) {
      tokens.push({ type: 'identifier', value: identifier[0].toLowerCase() })
      cursor += identifier[0].length
      continue
    }
    if ('+-*/%^(),'.includes(chunk[0])) {
      tokens.push({ type: chunk[0], value: chunk[0] })
      cursor++
      continue
    }
    throw new Error('Carattere non consentito')
  }
  tokens.push({ type: 'eof', value: '' })
  return tokens
}

function evaluate(expression) {
  const tokens = tokenize(expression)
  let index = 0
  const peek = () => tokens[index]
  const take = type => {
    if (peek().type !== type) throw new Error('Espressione incompleta')
    return tokens[index++]
  }

  function primary() {
    if (peek().type === 'number') return take('number').value
    if (peek().type === '(') {
      take('(')
      const value = addSub()
      take(')')
      return value
    }
    if (peek().type === 'identifier') {
      const name = take('identifier').value
      if (name === 'pi') return Math.PI
      if (name === 'e') return Math.E
      if (!functions[name]) throw new Error(`Funzione non supportata: ${name}`)
      take('(')
      const values = [addSub()]
      while (peek().type === ',') {
        take(',')
        values.push(addSub())
      }
      take(')')
      if (values.length !== 1) throw new Error('Questa funzione accetta un solo valore')
      return functions[name](values[0])
    }
    throw new Error('Valore mancante')
  }

  function unary() {
    if (peek().type === '+') {
      take('+')
      return unary()
    }
    if (peek().type === '-') {
      take('-')
      return -unary()
    }
    return primary()
  }

  function power() {
    const left = unary()
    if (peek().type !== '^') return left
    take('^')
    return Math.pow(left, power())
  }

  function multiplyDivide() {
    let value = power()
    while (['*', '/', '%'].includes(peek().type)) {
      const operator = take(peek().type).type
      const right = power()
      if ((operator === '/' || operator === '%') && right === 0) throw new Error('Divisione per zero')
      value = operator === '*' ? value * right : operator === '/' ? value / right : value % right
    }
    return value
  }

  function addSub() {
    let value = multiplyDivide()
    while (['+', '-'].includes(peek().type)) {
      const operator = take(peek().type).type
      const right = multiplyDivide()
      value = operator === '+' ? value + right : value - right
    }
    return value
  }

  const result = addSub()
  if (peek().type !== 'eof') throw new Error('Espressione non valida')
  if (!Number.isFinite(result) || Math.abs(result) > MAX_ABSOLUTE_RESULT) throw new Error('Risultato fuori limite')
  return result
}

function formatResult(value) {
  return Number.isInteger(value) ? value.toLocaleString('it-IT') : value.toLocaleString('it-IT', { maximumFractionDigits: 12 })
}

async function calculator(m, { text, usedPrefix, command }) {
  const expression = String(text || '').trim().replace(/,/g, '.')
  if (!expression) {
    return m.reply(pluginUi.box('🧮 Calcolatrice', [
      pluginUi.row('ℹ️', 'Uso:', `${usedPrefix}${command} <espressione>`),
      pluginUi.row('✨', 'Esempio:', `${usedPrefix}${command} sqrt(81) + 5^2`),
      pluginUi.row('🔧', 'Funzioni:', 'sqrt, abs, sin, cos, tan, log, ln, round')
    ]))
  }
  if (expression.length > MAX_EXPRESSION_LENGTH) return m.reply(pluginUi.box('⚠️ Calcolatrice', [pluginUi.row('🚫', 'Limite:', `${MAX_EXPRESSION_LENGTH} caratteri massimi`)]))

  try {
    const result = evaluate(expression)
    return m.reply(pluginUi.box('🧮 Calcolatrice', [
      pluginUi.row('📝', 'Espressione:', expression),
      pluginUi.row('✅', 'Risultato:', formatResult(result))
    ]))
  } catch (error) {
    return m.reply(pluginUi.box('⚠️ Calcolatrice', [
      pluginUi.row('🚫', 'Errore:', error.message),
      pluginUi.row('💡', 'Esempio:', `${usedPrefix}${command} (12 + 8) / 4`)
    ]))
  }
}

export default definePlugin(calculator, {
  name: 'tools-calculator',
  command: ['calc', 'calcola'],
  category: 'tools',
  target: 'all',
  roles: ['user', 'mod', 'admin', 'owner'],
  description: 'Calcola espressioni matematiche senza eseguire codice',
  icon: '🧮',
  order: 6,
  permissions: { roles: ['user', 'mod', 'admin', 'owner'] }
})
