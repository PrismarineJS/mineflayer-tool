/**
 * This example will trigger the bot to try and harvest the given block, pulling tools
 * from nearby chests if needed.
 */

if (process.argv.length < 4 || process.argv.length > 6) {
  console.log('Usage : node toolFetcher.js <host> <port> [<name>] [<password>]')
  process.exit(1)
}

// Load libraries
const mineflayer = require('mineflayer')
const toolPlugin = require('mineflayer-tool').plugin

// Create the bot
const bot = mineflayer.createBot({
  host: process.argv[2],
  port: process.argv[3],
  username: process.argv[4] || 'ToolFetcher_Bot',
  password: process.argv[5]
})

// Load the tool plugin
bot.loadPlugin(toolPlugin)

// On spawn, add nearby chests to the bot's available chest location list
bot.once('spawn', () => {
  const mcData = require('minecraft-data')(bot.version)
  bot.tool.chestLocations = bot.findBlocks({
    matching: mcData.blocksByName.chest.id,
    maxDistance: 16,
    count: 999
  })
})

// Listen for chat events
bot.on('chat', async (username, message) => {
  // Only listen for when someone says 'get tool'
  if (message !== 'mine') return

  // Get the player who said it
  const player = bot.players[username]

  // Print an error in chat if the bot can't see the player
  if (!player) {
    bot.chat("I can't see you!")
    return
  }

  // Get the block below the player
  const blockPos = player.entity.position.offset(0, -1, 0)
  const block = bot.blockAt(blockPos)

  // Let the player know it's working
  bot.chat(`Getting best tool for ${block.name}`)

  // Equip the best tool for mining that block
  try {
    bot.tool.equipForBlock(block, {
      requireHarvest: true, // If true, the bot will only use tools that can harvest the block
      getFromChest: true, // If we don't have the right tool, go find one in a chest
      maxTools: 3 // When withdrawing from a chest, grab up to 3 tools at a time
    })
    await bot.dig(block)
    console.info('Finished digging')
  } catch (err) {
    bot.chat(err.message)
    console.log(err)
  }
})
