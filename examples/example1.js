/**
 * This example bot runs the plugin template.
 */

if (process.argv.length < 4 || process.argv.length > 6) {
  console.log('Usage : node example1.js <host> <port> [<name>] [<password>]')
  process.exit(1)
}

const mineflayer = require('mineflayer')
const pluginTemplate = require('mineflayer-plugin-template')

const bot = mineflayer.createBot({
  host: process.argv[2],
  port: parseInt(process.argv[3]),
  username: process.argv[4] ? process.argv[4] : 'PluginTemplate',
  password: process.argv[5]
})

bot.loadPlugin(pluginTemplate)
