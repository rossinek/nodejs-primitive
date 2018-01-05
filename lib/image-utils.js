'use strict'
const fs = require('fs')
const sharp = require('sharp')
const GifEncoder = require('gif-encoder');

const Color = require('./Color')

module.exports = {
  rmsError (buffer1, buffer2) {
    if (buffer1.length !== buffer2.length) {
      throw new Error('rmsError not implemented for buffers with different lengths')
    }
    let sum = 0
    let diff
    for (let i = buffer1.length - 1; i >= 0; i--) {
      diff = buffer1[i] - buffer2[i]
      sum += diff * diff
    }
    return Math.sqrt(sum / buffer1.length) / 255
  },

  averageColor (buffer) {
    let r = 0
    let g = 0
    let b = 0
    const len = buffer.length
    for (let i = 0; i < len; i += 4) {
      r += buffer[i]
      g += buffer[i + 1]
      b += buffer[i + 2]
    }
    r /= len * 0.25
    g /= len * 0.25
    b /= len * 0.25
    return new Color(Math.floor(r), Math.floor(g), Math.floor(b), 255)
  },

  create (length, fillColor) {
    const buffer = Buffer.alloc(length, 0)
    for (let i = 0; i < length; i += 4) {
      buffer[i] = fillColor.r
      buffer[i + 1] = fillColor.g
      buffer[i + 2] = fillColor.b
      buffer[i + 3] = fillColor.a
    }
    return buffer
  },

  bufferToRGBA (buffer, info) {
    const size = info.width * info.height
    const channels = info.channels
    const newBuffer = Buffer.alloc(size * 4, 255)
    for (let i = 0; i < size; i++) {
      for (let c = 0; c < channels; c++) {
        newBuffer[i * 4 + c] = buffer[i * channels + c]
      }
    }
    return newBuffer
  },

  resizeImage (sharpimg, size) {
    return new Promise(async (resolve, reject) => {
      await sharpimg
        .resize(size, size)
        .max()
        .raw()
        .toBuffer({}, (err, buffer, info) => {
          if (err) {
            reject(err)
            return
          }
          resolve({ buffer, info })
        })
    })
  },

  async loadAndResizeImage (path, size) {
    const img = await sharp(path)
    const metadata = await img.metadata()
    const oldSize = Math.max(metadata.width, metadata.height)
    const { buffer, info } = await this.resizeImage(img, size)
    const imageBuffer = this.bufferToRGBA(buffer, info)
    return {
      imageBuffer,
      imageInfo: { width: info.width, height: info.height, channels: 4 },
      oldSize
    }
  },

  async saveRawBuffer (buffer, width, height, outputPath) {
    await sharp(buffer, {
      raw: {
        width: width,
        height: height,
        channels: 4
      }
    }).toFile(outputPath)
  },

  saveSvg (svg, outputPath) {
    return new Promise((resolve, reject) => {
      fs.writeFile(outputPath, svg, async (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  },

  async rasterizeSvgAndSave (svg, w, h, outputPath) {
    const outputBuffer = new Buffer(svg)
    await sharp(outputBuffer)
      .resize(w, h)
      .toFile(outputPath)
  },

  initGifEncoder (outputPath, w, h, fps) {
    // before first frame
    this.gifOutput = new GifEncoder(w, h)
    this.gifOutput.setRepeat(0) // loop indefinitely
    this.gifOutput.setFrameRate(fps)
    const file = fs.createWriteStream(outputPath)
    this.gifOutput.pipe(file)
    this.gifOutput.writeHeader()
  },

  async addSvgAsGifFrame (svg, w, h, outputPath) {
    const outputBuffer = new Buffer(svg)
    const pixels = await sharp(outputBuffer)
      .resize(w, h)
      .raw()
      .toBuffer(outputPath)
    this.gifOutput.addFrame(pixels)
  },

  finishGifEncoder () {
    this.gifOutput.finish()
  }
}
