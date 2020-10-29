import { Bot } from 'mineflayer';
import { Block } from 'prismarine-block';
import { Item } from 'prismarine-item';

// @ts-expect-error ; nbt has no typescript header
import * as nbt from 'prismarine-nbt';

export type Callback = (err?: Error) => void;

function error(name: string, message: string): Error
{
    const e = new Error(message);
    e.name = name;
    return e;
}

/**
 * Options to pass to the equipForBlock function.
 */
export interface MiningEquipOptions
{
    /**
     * If true, the bot will only attempt to use tools that are capable of
     * harvesting the target block. If the bot does not have any tools capable
     * of harvesting the block, an error will be thrown.
     * 
     * Defaults to false.
     */
    requireHarvest?: boolean;
}

export class Tool
{
    private readonly bot: Bot;

    constructor(bot: Bot)
    {
        this.bot = bot;
    }

    private getDigTime(block: Block, item?: Item): number
    {
        // @ts-expect-error ; entity effects not in typescript header
        const effects = this.bot.entity.effects;
        const enchants = (item && item.nbt) ? nbt.simplify(item.nbt).Enchantments : [];

        // @ts-expect-error ; enchants/effects not in digTime typescript header
        return block.digTime(item ? item.type : null, false, false, false, enchants, effects)
    }

    /**
     * Gets the item currently in the bot's hand.
     */
    private itemInHand(): Item | undefined
    {
        return this.bot.inventory.slots[this.bot.getEquipmentDestSlot('hand')];
    }

    /**
     * Checks if the best item in the item list is faster than the item in
     * the bot's hand.
     * 
     * @param block - The block to test against.
     * @param itemList - The item list to test against.
     */
    private isBetterMiningTool(block: Block, itemList: Item[]): boolean
    {
        const item = this.itemInHand();
        if (!item) return true;
        if (itemList.indexOf(item) < 0) return true;

        return this.getDigTime(block, itemList[0]) < this.getDigTime(block, item);
    }

    /**
     * This function can be used to equip the best tool currently in the bot's
     * inventory for breaking the given block.
     * 
     * @param block - The block the bot is attempting to break.
     * @param options - The options to use for equipping the correct tool.
     * @param cb - The callback.
     */
    equipForBlock(block: Block, options: MiningEquipOptions = {}, cb: Callback = () => {}): void
    {
        let itemList = [...this.bot.inventory.items()];
        
        if (options.requireHarvest)
            itemList = itemList.filter(item => block.canHarvest(item.type));

        itemList.sort((a, b) => this.getDigTime(block, a) - this.getDigTime(block, b));

        if (itemList.length === 0)
        {
            if (options.requireHarvest)
                cb(error('NoItem', 'Bot does not have a harvestable tool!'));
            else
                cb();

            return;
        }

        // Don't change item if it has the same performance as the equipped item.
        // Otherwise you just create unneeded equipment calls and can potentially
        // get stuck in an infinite loop in some conditions.
        if (!this.isBetterMiningTool(block, itemList))
        {
            cb();
            return;
        }

        this.bot.equip(itemList[0], 'hand', cb);
    }
}