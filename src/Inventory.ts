import { Bot } from 'mineflayer'
import { Vec3 } from 'vec3'
import { error, Callback } from './Tool'
import { Item } from 'prismarine-item'
import { goals, ComputedPath } from 'mineflayer-pathfinder'
import { TemporarySubscriber } from './TemporarySubscriber'
import { TaskQueue } from './TaskQueue'

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
export function retrieveTools (bot: Bot, options: ToolRetrievalOptions, cb: Callback): void {
  const chestLocations = [...options.chestLocations]

  const tryNextChest = (): void => {
    const chest = getClosestChest(bot, chestLocations)

    if (chest == null) {
      cb(error('NoChest', 'There are no chests with available tools in them!'))
      return
    }

    chestLocations.splice(chestLocations.indexOf(chest), 1)

    gotoChest(bot, chest, (err) => {
      if (err != null) {
        cb(err)
        return
      }

      pullFromChest(bot, chest, options, (err2: Error | undefined, gotItem: boolean) => {
        if (err2 != null) {
          cb(err2)
          return
        }

        if (gotItem) {
          cb()
          return
        }

        tryNextChest()
      })
    })
  }

  tryNextChest()
}

/**
 * Moves the bot to the chest.
 *
 * @param bot - The bot to move.
 * @param location - The location to move to.
 * @param cb - The callback to run when finished.
 */
function gotoChest (bot: Bot, location: Vec3, cb: Callback): void {
  // @ts-expect-error
  const pathfinder = bot.pathfinder

  pathfinder.setGoal(new goals.GoalBlock(location.x, location.y, location.z))

  const events = new TemporarySubscriber(bot)
  events.subscribeTo('goal_reached', () => {
    events.cleanup()
    cb()
  })

  events.subscribeTo('path_update', (results: ComputedPath) => {
    if (results.status === 'noPath') {
      events.cleanup()
      cb(error('NoPath', 'No path to target block!'))
    }
  })

  events.subscribeTo('goal_updated', () => {
    events.cleanup()
    cb(error('PathfindingInterrupted', 'Pathfinding interrupted before item could be reached.'))
  })
}

function pullFromChest (bot: Bot, chestPos: Vec3, options: ToolRetrievalOptions, cb: (err: Error | undefined, gotItem: boolean) => void): void {
  const chestBlock = bot.blockAt(chestPos)
  if (chestBlock == null) {
    cb(error('UnloadedChunk', 'Chest is located in an unloaded chunk!'), false)
    return
  }

  const chest = bot.openChest(chestBlock)

  chest.once('open', () => {
    let itemsToPull: Item[] = []
    for (const item of chest.items()) {
      if (options.toolFilter(item)) { itemsToPull.push(item) }
    }

    if (itemsToPull.length === 0) {
      cb(undefined, false)
      return
    }

    itemsToPull.sort((a, b) => options.toolCostFilter(a) - options.toolCostFilter(b))

    const maxTools = options.maxTools ?? 1
    if (itemsToPull.length > maxTools) {
      itemsToPull = itemsToPull.slice(0, maxTools)
    }

    const taskQueue = new TaskQueue()
    for (const item of itemsToPull) {
      taskQueue.add(cb2 => {
        chest.withdraw(item.type, item.metadata, item.count).then(() => cb2).catch(err => cb2(err))
      })
    }

    taskQueue.addSync(() => chest.close())
    taskQueue.add(cb2 => setTimeout(cb2, 200)) // Wait for server to update inventory
    taskQueue.runAll(err => {
      if (err != null) {
        cb(err, false)
        return
      }

      cb(undefined, true)
    })
  })
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
