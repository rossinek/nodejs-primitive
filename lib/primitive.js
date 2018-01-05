'use strict'

const AppHelper = require('./appHelper')
const ImageUtils = require('./image-utils')
const Utils = require('./utils')
const Model = require('./Model')
const Logger = require('./logger')


module.exports = {
  async recreate (inputPath, outputPath, config) {
    config.input = inputPath
    config.output = outputPath
    const args = AppHelper.parseAndValidateConfig(config)
    Logger.init(args)

    const { imageBuffer, imageInfo, oldSize } = await loadAndResizeTarget(args.input, args.resizeInput)
    Logger.vv('Determining background color...')
    Logger.vvTime('bg color')
    const backgroundColor = ImageUtils.averageColor(imageBuffer)
    Logger.vvTimeEnd('bg color')

    for (let frame = 0; frame < args.frames; frame++) {
      Logger.v(`Start algorithm${args.frames > 1 ? ` for frame ${frame}` : ''}...`)
      const model = new Model(imageBuffer, imageInfo, backgroundColor, args.resizeOutput || oldSize)
      Logger.vTime('all iterations')
      for (let si = 0; si < args.number; si++) {
        Logger.vvTime(`iteration ${si}`)
        const n = model.step('triangle', args.alpha, args.repeat)
        Logger.vvTimeEnd(`iteration ${si}`)
        Logger.vv(`${si}: score=${model.score}`)
        if (args.outputExtension === 'gif' && args.animationMode === AppHelper.ANIM_MODE_PROGRESSIVE) {
          await saveOutputFrame(model.svg(), model.outputWidth, model.outputHeight, args, si, args.number)
        }
      }
      Logger.vTimeEnd('all iterations')
      if (args.outputExtension !== 'gif' || args.animationMode !== AppHelper.ANIM_MODE_PROGRESSIVE) {
        await saveOutputFrame(model.svg(), model.outputWidth, model.outputHeight, args, frame, args.frames)
      }
    }

    Logger.vv('Done.')
  },

  async runCommandLineApp () {
    const config = AppHelper.parseArgs()
    if (config.help) {
      AppHelper.showUsage()
      return 0
    }

    try {
      await this.recreate(config.input, config.output, config)
    } catch (e) {
      Logger.error(e + '\n')
      AppHelper.showUsage()
      return 1
    }
  }
}

async function loadAndResizeTarget (path, size) {
  Logger.v('Loading and resizing input file...')
  const imageData = ImageUtils.loadAndResizeImage(path, size)
  Logger.v('File loaded.')
  Logger.vv(`Resized from ${imageData.oldSize} to ${size}.`)
  return imageData
}

async function saveOutputFrame (svg, w, h, args, frame, frames) {
  if (args.outputExtension === 'gif') {
    if (frame === 0) {
      // before first frame
      Logger.v('Create file...')
      ImageUtils.initGifEncoder(args.output, w, h, args.fps)
    }

    Logger.v('Saving output frame...')
    await ImageUtils.addSvgAsGifFrame(svg, w, h, args.output)
    Logger.v('Frame saved.')

    if (frame >= frames - 1) {
      // after last frame
      Logger.v('Saving output file...')
      ImageUtils.finishGifEncoder()
      Logger.v('File saved.')
    }
  } else if (args.outputExtension === 'svg') {
    Logger.v('Saving output file...')
    await ImageUtils.saveSvg(svg, w, h, args.output)
    Logger.v('File saved.')
  } else {
    Logger.v('Saving output file...')
    await ImageUtils.rasterizeSvgAndSave(svg, w, h, args.output)
    Logger.v('File saved.')
  }
}

