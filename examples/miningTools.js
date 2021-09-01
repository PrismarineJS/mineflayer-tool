/**
 * This example will trigger the bot to equip the best tool for mining the target block.
 */

if (process.argv.length < 4 || process.argv.length > 6) {
  console.log('Usage : node miningTools.js <host> <port> [<name>] [<password>]')
  process.exit(1)
}

// Load libraries
const mineflayer = require('mineflayer')
const toolPlugin = require('mineflayer-tool').plugin

// Create the bot
const bot = mineflayer.createBot({
  host: process.argv[2],
  port: process.argv[3],
  username: process.argv[4] || 'MiningTool_Bot',
  password: process.argv[5]
})

// Load the tool plugin
bot.loadPlugin(toolPlugin)

// Listen for chat events
bot.on('chat', async (username, message) => {
  // Only listen for when someone says 'get tool'
  if (message !== 'get tool') return

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
  bot.tool.equipForBlock(block)

  // You can also specify other options and use await
  /*
  const mcData = require('minecraft-data')(bot.version)
  bot.tool.chestLocations = bot.findBlocks({
    matching: mcData.blocksByName.chest.id,
    maxDistance: 16,
    count: 999
  })

  try {
    await bot.tool.equipForBlock(block, {
      requireHarvest: true,
      getFromChest: true
    })
    await bot.dig(block)
  } catch (err) {
    console.log(err)
  } */
})
