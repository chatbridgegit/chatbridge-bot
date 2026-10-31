import { definePlugin } from './plugin-utils.js'

const roles = ['user', 'mod', 'admin', 'owner']

export function defineUnityLifePlugin(handler, metadata) {
  const pluginHandler = function unityLifeCommand(...args) {
    return handler.apply(this, args)
  }

  return definePlugin(pluginHandler, {
    customPrefix: /^\./,
    target: 'all',
    roles,
    permissions: { roles },
    ...metadata
  })
}
