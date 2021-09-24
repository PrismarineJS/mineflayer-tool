import { Bot } from 'mineflayer'
import { Vec3 } from 'vec3'
import { error, Callback } from './Tool'
import { Item } from 'prismarine-item'
import { goals } from 'mineflayer-pathfinder'
import { promisify } from 'util'
const wait = promisify(setTimeout)

/**
 * A standard tool filter that returns true for all tools and false
 * for everything else.
 *
 * @param item - The item to test against.
 */
export function standardToolFilter (item: Item): boolean {
  if (item.name.includes('sword')) return true
  if (item.name.includes('pickaxe')) return true
  if (item.name.includes('shovel')) return true
  if (item.name.includes('axe')) return true
  if (item.name.includes('hoe')) return true
  return false
}

/**
 * Options for configuring how to select what chests to go to to retrieve items.
 */
export interface ToolRetrievalOptions {
  /**
     * An array of all chest locations to check for in order to retrieve tools from.
     */
  chestLocations: Vec3[]

  /**
     * Gets the tool filter to use for determining what tools are allowed to be pulled
     * from the chest.
     */
  toolFilter: ToolFilter

  /**
     * Gets the cost of a tool that is allowed through the filter. The tools with the
     * lowest cost are prioritized over tools with a higher cost.
     */
  toolCostFilter: ToolCostFilter

  /**
     * Gets the maximum number of tools that can be retrieved from the chest at once.
     * If the chest contains fewer than this number (but at least 1), only those are
     * retrieved and the callback returns normally. If the chest contains more than
     * this number of tools, only this number of tools are retrieved.
     */
  maxTools?: number
}

/**
 * A filter than can be used to filter what items are allowed to be
 * pulled out of a chest and what items can't.
 *
 * @param item - The item stack to test against.
 *
 * @returns True if the item can be pulled out of the chest. False otherwise.
 */
export type ToolFilter = (item: Item) => boolean

/**
 * Gets the tool cost of an item that is allowed through the item filter.
 * This value is usually the time taken to mine a block or similar. Lower
 * values are better.
 *
 * @param item - The item stack to test against.
 *
 * @returns The cost of this item stack.
 */
export type ToolCostFilter = (item: Item) => number

/**
 * Moves from chest to chest in an effort to get at least one tool that meets the given requirements.
 * Throws an error in the callback if a tool cannot be retrieved.
 *
 * @param bot - The bot.
 * @param options - The options to use when collecting tools.
 * @param cb - The callback to execute when the function has completed.
 */
export async function retrieveTools (bot: Bot, options: ToolRetrievalOptions, cb?: Callback): Promise<void> {
  const chestLocations = [...options.chestLocations]
  while (chestLocations.length > 0) {
    const chest = getClosestChest(bot, chestLocations)

    if (chest == null) {
      const err = error('NoChest', 'There are no chests with available tools in them!')
      if ((cb != null) && typeof cb === 'function') cb(err)
      throw err
    }

    chestLocations.splice(chestLocations.indexOf(chest), 1)

    try {
      console.info('Going to chest', chest)
      await gotoChest(bot, chest)
      console.info('Pulling from chest', chest, options)
      const gotItem = await pullFromChest(bot, chest, options)

      if (gotItem) {
        if (cb != null) cb()
        return
      }
    } catch (err: any) {
      if (cb != null) cb(err)
      throw err
    }
  }
}

/**
 * Moves the bot to the chest.
 *
 * @param bot - The bot to move.
 * @param location - The location to move to.
 * @param cb - The callback to run when finished.
 * @returns {Promise<void>}
 */
async function gotoChest (bot: Bot, location: Vec3, cb?: Callback): Promise<void> {
  const pathfinder = bot.pathfinder
  try {
    await pathfinder.goto(new goals.GoalGetToBlock(location.x, location.y, location.z))
  } catch (err: any) {
    if ((cb != null) && typeof cb === 'function') cb(err)
    throw err
  }
}

/**
 * Pull items from a given chest
 * @param bot Bot
 * @param chestPos Chest Position
 * @param options Tool Retrieval Options {@link ToolRetrievalOptions}
 * @param cb Optional callback
 * @returns {Promise<boolean>}
 */
async function pullFromChest (bot: Bot, chestPos: Vec3, options: ToolRetrievalOptions, cb?: (err: Error | undefined, gotItem: boolean) => void): Promise<boolean> {
  const chestBlock = bot.blockAt(chestPos)
  if (chestBlock == null) {
    const err = error('UnloadedChunk', 'Chest is located in an unloaded chunk!')
    if ((cb != null) && typeof cb === 'function') cb(err, false)
    throw err
  }

  try {
    const chest = await bot.openChest(chestBlock)

    let itemsToPull: Item[] = []
    for (const item of chest.items()) {
      if (options.toolFilter(item)) { itemsToPull.push(item) }
    }

    if (itemsToPull.length === 0) {
      if ((cb != null) && typeof cb === 'function') cb(undefined, false)
      return false
    }

    itemsToPull.sort((a, b) => options.toolCostFilter(a) - options.toolCostFilter(b))

    const maxTools = options.maxTools ?? 1
    if (itemsToPull.length > maxTools) {
      itemsToPull = itemsToPull.slice(0, maxTools)
    }

    for (const item of itemsToPull) {
      await chest.withdraw(item.type, item.metadata, item.count)
    }
    chest.close()
    await wait(200) // Wait for server to update inventory
  } catch (err: any) {
    if ((cb != null) && typeof cb === 'function') cb(err, true)
    throw err
  }
  return true
}

/**
 * Gets the location of the nearest chest.
 *
 * @param bot - The bot.
 * @param chestLocations - The list of all chest locations.
 *
 * @returns The nearest chest location, or null if the chest location
 *          array is empty.
 */
function getClosestChest (bot: Bot, chestLocations: Vec3[]): Vec3 | null {
  let location: Vec3 | null = null
  let distance = 0

  for (const chestLocation of chestLocations) {
    const dist = bot.entity.position.distanceTo(chestLocation)
    if (location == null || dist < distance) {
      location = chestLocation
      distance = dist
    }
  }

  return location
}
