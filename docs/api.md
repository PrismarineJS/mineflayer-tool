# API <!-- omit in toc -->

Welcome to the *Mineflayer-Tool* API documentation page.

## Table of Contents <!-- omit in toc -->

- [1. Summary](#1-summary)

## 1. Summary

* `bot.tool.equipForBlock(block: Block, options?: MiningEquipOptions, cb?: (err?: Error) => void): Promise<void>`
  
  Can be used to instruct the bot to equip the best tool for mining the target block. Tools that are faster are considered better.

  Options:

  * `requireHarvest: boolean`

    If true, only tools that can harvest the item are considered. (I.e. requires iron pickaxe to mine diamond ore) If bot does not have a tool in it's inventory that can harvest the target block, an error is thrown.