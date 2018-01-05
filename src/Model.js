'use strict'
const Core = require('./core')
const Optimize = require('./optimize')
const ImageUtils = require('./image-utils')
const Worker = require('./Worker')
const Logger = require('./Logger')

class Model {
  constructor (targetBuffer, metadata, backgroundColor, size) {
    this.width = metadata.width
    this.height = metadata.height
    const aspect = this.width / this.height
    var ow, oh
    let scale
    if (aspect >= 1) {
      ow = size
      oh = Math.floor(size / aspect)
      scale = size / this.width
    } else {
      ow = Math.floor(size * aspect)
      oh = size
      scale = size / this.height
    }
    this.outputWidth = ow
    this.outputHeight = oh
    this.scale = scale
    this.background = backgroundColor
    this.target = targetBuffer
    this.current = ImageUtils.create(this.target.length, this.background)
    this.score = Core.differenceFull(this.target, this.current)
    this.worker = new Worker(this.target, metadata)
    this.shapes = []
    this.scores = []
    this.colors = []
    this.iterationNumber = 0
  }


  svg () {
    const lines = []
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${this.outputWidth}" height="${this.outputHeight}">`)
    lines.push(`<rect x="0" y="0" width="${this.outputWidth}" height="${this.outputHeight}" fill="${this.background.toHex()}" />`)
    lines.push(`<g transform="scale(${this.scale}) translate(0.5 0.5)">`)
    for (let i = 0; i < this.shapes.length; i++) {
      const shape = this.shapes[i]
      const color = this.colors[i]
      const attrs = `fill="${color.toHex()}" fill-opacity="${color.a/255}"`
      lines.push(shape.svg(attrs))
    }
    lines.push('</g>')
    lines.push('</svg>')
    return lines.join('\n')
  }

  add (shape, alpha) {
    this.iterationNumber++
    const before = Buffer.allocUnsafe(this.current.length)
    this.current.copy(before)
    const scanlines = shape.rasterize()
    const color = Core.computeColor(this, scanlines, alpha)
    Core.drawLines(this, this.current, color, scanlines)
    const score = Core.differencePartial(this, this.target, before, this.current, this.score, scanlines)

    this.score = score
    this.shapes.push(shape)
    this.colors.push(color)
    this.scores.push(score)
  }

  step (shapeType, alpha, repeat) {
    Logger.vvTime('hillclimb')
    let state = this.runWorker(shapeType, alpha, 1000, 100, 16)
    Logger.vvTimeEnd('hillclimb')
    // console.log('>', state.score)
    // state = HillClimb(state, 1000).(*State)
    this.add(state.shape, state.alpha)

    let a, b
    for (let i = 0; i < repeat; i++) {
      state.worker.init(this.current, this.score)
      a = state.energy()
      state = Optimize.hillClimb(state, 100)
      b = state.energy()
      if (a === b) {
        break
      }
      this.add(state.shape, state.alpha)
    }

    // for _, w := range model.Workers[1:] {
    //  model.Workers[0].Heatmap.AddHeatmap(w.Heatmap)
    // }
    // SavePNG("heatmap.png", model.Workers[0].Heatmap.Image(0.5))
    return this.worker.counter
  }


  runWorker (t, a, n, age, m) {
    this.worker.init(this.current, this.score)
    return this.worker.bestHillClimbState(t, a, n, age, m)
  }
}

module.exports = Model
