'use strict'
const sharp = require('sharp')
const fs = require('fs')

const AppHelper = require('./src/AppHelper')
const ImageUtils = require('./src/image-utils')
const Utils = require('./src/utils')
const Model = require('./src/Model')
const Logger = require('./src/Logger')

const TMP_INPUT_PATH = '_primitive-temporary-input.png'
const TMP_OUTPUT_PATH = '_primitive-temporary-output.svg'

const args = AppHelper.parseArgs()
Logger.init(args)
const outputExtension = Utils.getExtension(args.output)

async function main () {
  try {
    const { imageBuffer, imageMetadata, oldSize } = await loadAndResizeTarget(args.input, args.resizeInput)
    Logger.vv('Determining background color...')
    Logger.vvTime('bg color')
    const backgroundColor = ImageUtils.averageColor(imageBuffer)
    Logger.vvTimeEnd('bg color')

    for (let frame = 0; frame < args.frames; frame++) {
      Logger.v(`Start algorithm${args.frames > 1 ? ` for frame ${frame}` : ''}...`)
      const model = new Model(imageBuffer, imageMetadata, backgroundColor, args.resizeOutput || oldSize)
      Logger.vTime('all iterations')
      for (let si = 0; si < args.number; si++) {
        Logger.vvTime(`iteration ${si}`)
        const n = model.step('triangle', args.alpha, args.repeat)
        Logger.vvTimeEnd(`iteration ${si}`)
        Logger.vv(`${si}: score=${model.score}`)
        if (outputExtension === 'gif' && args.animationMode === AppHelper.ANIM_MODE_PROGRESSIVE) {
          await saveOutputFrame(model.svg(), model.outputWidth, model.outputHeight, si, args.number)
        }
      }
      Logger.vTimeEnd('all iterations')
      if (outputExtension !== 'gif' || args.animationMode !== AppHelper.ANIM_MODE_PROGRESSIVE) {
        await saveOutputFrame(model.svg(), model.outputWidth, model.outputHeight, frame, args.frames)
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    Logger.vv('Removing temporary files...')
    if (fs.existsSync(TMP_INPUT_PATH)) fs.unlinkSync(TMP_INPUT_PATH)
    if (fs.existsSync(TMP_OUTPUT_PATH)) fs.unlinkSync(TMP_OUTPUT_PATH)
    Logger.vv('Done.')
  }
}

async function loadAndResizeTarget (path, size) {
  Logger.v('Loading and resizing input file...')
  const img = await sharp(path)
  const metadata = await img.metadata()
  await img
    .resize(size, size)
    .max()
    .raw()
    .toFile(TMP_INPUT_PATH)
  const image = await sharp(TMP_INPUT_PATH).raw()
  const oldSize = Math.max(metadata.width, metadata.height)
  const imageMetadata = await image.metadata()
  const imageBuffer = ImageUtils.bufferToRGBA(await image.toBuffer(), imageMetadata.width, imageMetadata.height)
  fs.unlinkSync(TMP_INPUT_PATH)
  Logger.v('File loaded.')
  Logger.vv(`Resized from ${oldSize} to ${size}.`)
  return { imageBuffer, imageMetadata, oldSize }
}

async function saveOutputFrame (svg, w, h, frame, frames) {
  if (outputExtension === 'gif') {
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
  } else if (outputExtension === 'svg') {
    Logger.v('Saving output file...')
    await ImageUtils.saveSvg(svg, w, h, args.output)
    Logger.v('File saved.')
  } else {
    Logger.v('Saving output file...')
    await ImageUtils.rasterizeSvgAndSave(svg, w, h, args.output)
    Logger.v('File saved.')
  }
}

main()
