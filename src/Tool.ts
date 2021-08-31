import { Bot } from 'mineflayer'
import { Block } from 'prismarine-block'
import { Item } from 'prismarine-item'
import { retrieveTools, standardToolFilter } from './Inventory'
import { Vec3 } from 'vec3'

import * as nbt from 'prismarine-nbt'

export type Callback = (err?: Error) => void

export function error (name: string, message: string): Error {
  const e = new Error(message)
  e.name = name
  return e
}

/**
 * Options to pass to the equipForBlock function.
 */
export interface MiningEquipOptions {
  /**
     * If true, the bot will only attempt to use tools that are capable of
     * harvesting the target block. If the bot does not have any tools capable
     * of harvesting the block, an error will be thrown.
     *
     * Defaults to false.
     */
  requireHarvest?: boolean

  /**
     * If set to true, the bot will attempt to retrieve a tool from the chest if
     * there is not a suitable tool currently in the bot's inventory.
     *
     * Defaults to false.
     */
  getFromChest?: boolean

  /**
     * If using the `getFromChest` flag, what is the maximum number of tools allowed
     * to be pulled from the chest at once? Defaults to 1.
     */
  maxTools?: number
}

/**
 * The main class object for the tool plugin.
 */
export class Tool {
  private readonly bot: Bot

  /**
     * A list of chest locations that the bot is allowed to retrieve items from
     * when using the "getFromChest" option.
     */
  readonly chestLocations: Vec3[] = []

  /**
     * Creates a new tool plugin instance.
     *
     * @param bot - The bot the plugin is running on.
     */
  constructor (bot: Bot) {
    this.bot = bot
  }

  /**
     * Gets the number of ticks required to mine the target block with the given item.
     *
     * @param block - The block to test against.
     * @param item - The item to test with.
     *
     * @returns The number of ticks it would take to mine.
     */
  private getDigTime (block: Block, item?: Item): number {
    const effects = this.bot.entity.effects
    const enchants = item?.nbt != null ? nbt.simplify(item.nbt).Enchantments : []

    // @ts-expect-error ; enchants/effects not in digTime typescript header
    return block.digTime(item?.type, false, false, false, enchants, effects)
  }

  /**
     * Gets the item currently in the bot's hand.
     */
  private itemInHand (): Item | undefined {
    return this.bot.inventory.slots[this.bot.getEquipmentDestSlot('hand')]
  }

  /**
     * Checks if the best item in the item list is faster than the item in
     * the bot's hand.
     *
     * @param block - The block to test against.
     * @param itemList - The item list to test against.
     *
     * @returns True if the items in the list are better. False if they are worse or
     *          equal to what's already in the bot's hand.
     */
  private isBetterMiningTool (block: Block, itemList: Array<Item | undefined>): boolean {
    const item = this.itemInHand()
    if (item == null) return true
    if (!itemList.includes(item)) return true

    return this.getDigTime(block, itemList[0]) < this.getDigTime(block, item)
  }

  /**
     * This function can be used to equip the best tool currently in the bot's
     * inventory for breaking the given block.
     *
     * @param block - The block the bot is attempting to break.
     * @param options - The options to use for equipping the correct tool.
     * @param cb - The callback.
     */
  async equipForBlock (block: Block, options: MiningEquipOptions = {}, cb?: Callback): Promise<void> {
    let itemList: Array<Item | undefined> = [...this.bot.inventory.items()]

    // Add an "undefined" item if the bot has empty space in it's inventory.
    if (this.bot.inventory.emptySlotCount() >= 1) { itemList.unshift(undefined) }

    if (options.requireHarvest != null && options.requireHarvest) {
      itemList = itemList.filter(item => block.canHarvest(item != null ? item.type : null))
    }

    itemList.sort((a, b) => this.getDigTime(block, a) - this.getDigTime(block, b))

    if (itemList.length === 0) {
      if (options.getFromChest != null && options.getFromChest) {
        try {
          await retrieveTools(this.bot, {
            toolFilter: standardToolFilter,
            chestLocations: this.chestLocations,
            toolCostFilter: (item: Item) => this.getDigTime(block, item),
            maxTools: options.maxTools
          })
          await this.equipForBlock(block, options)
        } catch (err: any) {
          if (err != null && (cb != null)) cb(err)
          throw err
        }
        if (cb != null) cb()
        return
      }

      if (options.requireHarvest != null && options.requireHarvest) {
        const err = error('NoItem', 'Bot does not have a harvestable tool!')
        if (cb != null) cb(err)
        throw err
      } else {
        if (cb != null) cb()
      }

      return
    }

    // Don't change item if it has the same performance as the equipped item.
    // Otherwise you just create unneeded equipment calls and can potentially
    // get stuck in an infinite loop in some conditions.
    if (!this.isBetterMiningTool(block, itemList)) {
      if (cb != null) cb()
      return
    }

    const best = itemList[0]
    try {
      if (best != null) {
        await this.bot.equip(best, 'hand')
      } else {
        await this.bot.unequip('hand')
      }
    } catch (err: any) {
      if (cb != null) cb(err)
      throw err
    }
    if (cb != null) cb()
  }
}

declare module 'mineflayer' {
  interface Bot {
    tool: Tool
  }
}
