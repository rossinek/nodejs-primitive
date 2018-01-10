'use strict'
const Utils = require('./utils')
const ImageUtils = require('./image-utils')
const Color = require('../Color')

module.exports = {
  computeColor (context, scanlines, alpha) {
    const target = context.target
    const current = context.current
    let rsum = 0
    let gsum = 0
    let bsum = 0
    let count = 0
    let line, i, iLast
    const a = 0x101 * 255 / alpha
    const lineslen = scanlines.lines.length
    for (let li = 0; li < lineslen; li++) {
      line = scanlines.lines[li]
      iLast = (context.width * line.y + line.x1) * 4
      for (i = (context.width * line.y + line.x0) * 4; i <= iLast; i += 4) {
        rsum += (target[i] - current[i]) * a + current[i] * 0x101
        gsum += (target[i + 1] - current[i + 1]) * a + current[i + 1] * 0x101
        bsum += (target[i + 2] - current[i + 2]) * a + current[i + 2] * 0x101
        count++
      }
    }
    if (count === 0) {
      return new Color()
    }
    const r = Utils.clamp((rsum / count) >> 8, 0, 255)
    const g = Utils.clamp((gsum / count) >> 8, 0, 255)
    const b = Utils.clamp((bsum / count) >> 8, 0, 255)
    return new Color(r, g, b, alpha)
  },

  copyLines(context, dstBuffer, srcBuffer, scanlines) {
    let line, begin, end
    for (let li = scanlines.lines.length - 1; li >= 0; li--) {
      line = scanlines.lines[li]
      begin = (context.width * line.y + line.x0) * 4
      end = (context.width * line.y + line.x1) * 4
      srcBuffer.copy(dstBuffer, begin, begin, end + 4)
    }
  },

  drawLines (context, imgBuffer, color, scanlines) {
    const { r, g, b, a } = color
    let line, la, i, iLast
    let dr, dg, db, da
    for (let li = scanlines.lines.length - 1; li >= 0; li--) {
      line = scanlines.lines[li]
      iLast = (context.width * line.y + line.x1) * 4
      for (i = (context.width * line.y + line.x0) * 4; i <= iLast; i += 4) {
        dr = imgBuffer[i]
        dg = imgBuffer[i+1]
        db = imgBuffer[i+2]
        da = imgBuffer[i+3]
        const nda = da / 255
        const na = (a * line.alpha) / 65025
        imgBuffer[i] = Utils.clampInt(r * na + dr * nda * (1 - na))
        imgBuffer[i+1] = Utils.clampInt(g * na + dg * nda * (1 - na))
        imgBuffer[i+2] = Utils.clampInt(b * na + db * nda * (1 - na))
        imgBuffer[i+3] = Utils.clampInt((nda + na - nda * na) * 255)
      }
    }
  },

  differenceFull (a, b) {
    return ImageUtils.rmsError(a, b)
  },

  differencePartial (context, targetBuffer, beforeBuffer, afterBuffer, score, scanlines) {
    let d0, d1
    let total = (score * 255) * (score * 255) * targetBuffer.length
    let line, iLast, i, diffBefore, diffAfter
    for (let li = scanlines.lines.length - 1; li >= 0; li--) {
      line = scanlines.lines[li]
      iLast = (context.width * line.y + line.x1) * 4
      for (i = (context.width * line.y + line.x0) * 4; i <= iLast; i++) {
        diffBefore = targetBuffer[i] - beforeBuffer[i]
        diffAfter = targetBuffer[i] - afterBuffer[i]
        total -= diffBefore * diffBefore
        total += diffAfter * diffAfter
      }
    }
    return Math.sqrt(total / targetBuffer.length) / 255
  }
}
