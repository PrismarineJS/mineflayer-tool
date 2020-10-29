import { Bot } from 'mineflayer';
import { Tool } from './Tool';

export function plugin(bot: Bot): void
{
    // @ts-expect-error
    bot.tool = new Tool(bot);
}