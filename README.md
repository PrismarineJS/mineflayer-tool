### 1.3.0
* [Add repo commands workflow (#93)](https://github.com/PrismarineJS/mineflayer-tool/commit/2b008af52e8356f04714d5d59eae8f9497c7cb23) (thanks @rom1504)
* [Update CI to Node 24 (#92)](https://github.com/PrismarineJS/mineflayer-tool/commit/da7449753edfe097bcd3debc7ce6b0659191e129) (thanks @rom1504)
* [Bump typescript from 4.9.5 to 5.0.4 (#59)](https://github.com/PrismarineJS/mineflayer-tool/commit/939fc3c5e70d5bf9dc30125829f2f4c33a823d2c) (thanks @dependabot[bot])
* [Bump @types/node from 18.16.13 to 20.2.1 (#66)](https://github.com/PrismarineJS/mineflayer-tool/commit/10f5c9a2be30649a37e3d126907f11a1b8af3508) (thanks @dependabot[bot])
* [Bump @types/node from 17.0.45 to 18.6.4 (#53)](https://github.com/PrismarineJS/mineflayer-tool/commit/495981aa34d19ddcecdd9c9105e2d7651074a9da) (thanks @dependabot[bot])
* [NPM should install before publish in CI](https://github.com/PrismarineJS/mineflayer-tool/commit/8d6aa2a2701577fbdcf0eef806670d303a95e88f) (thanks @TheDudeFromCI)
* [Fix npm deploy (#44)](https://github.com/PrismarineJS/mineflayer-tool/commit/cae1058fd694754a133fdde9711a667fd5cb48ee) (thanks @TheDudeFromCI)

<h1 align="center">Mineflayer-Tool</h1>
<p align="center"><i>A tool/weapon selection Mineflayer plugin for automatically selecting the best tool to use for a specific task.</i></p>

<p align="center">
  <img src="https://github.com/TheDudeFromCI/mineflayer-tool/workflows/Build/badge.svg" />
  <img src="https://img.shields.io/npm/v/mineflayer-tool" />
  <img src="https://img.shields.io/github/repo-size/TheDudeFromCI/mineflayer-tool" />
  <img src="https://img.shields.io/npm/dm/mineflayer-tool" />
  <img src="https://img.shields.io/github/contributors/TheDudeFromCI/mineflayer-tool" />
  <img src="https://img.shields.io/github/license/TheDudeFromCI/mineflayer-tool" />
</p>

---

### Getting Started

This plugin is built using Node and can be installed using:
```bash
npm install --save mineflayer-tool
```

### Simple Bot

The brief description goes here.

```js
const mineflayer = require('mineflayer')
const toolPlugin = require('mineflayer-tool').plugin

const bot = mineflayer.createBot({ username: 'MiningTool_Bot' })
bot.loadPlugin(toolPlugin)

bot.on('spawn', async () => {
  const blockPos = bot.entity.position.offset(0, -1, 0)
  const block = bot.blockAt(blockPos)

  await bot.tool.equipForBlock(block, {})
  await bot.dig(block)
 })
```

### Documentation

[API](https://github.com/TheDudeFromCI/mineflayer-tool/blob/master/docs/api.md)

[Examples](https://github.com/TheDudeFromCI/mineflayer-tool/tree/master/examples)

### License

This project uses the [MIT](https://github.com/TheDudeFromCI/mineflayer-tool/blob/master/LICENSE) license.

### Contributions

This project is accepting PRs and Issues. See something you think can be improved? Go for it! Any and all help is highly appreciated!

For larger changes, it is recommended to discuss these changes in the issues tab before writing any code. It's also preferred to make many smaller PRs than one large one, where applicable.
