'use strict'
const Utils = require('./utils')
const mParseArgs = require('minimist')
const Table = require('tty-table')

const TYPE_IMAGE_PATH = 'img-path'
const TYPE_INT = 'int'
const TYPE_STRING_OPTION = 'option'
const TYPE_BOOLEAN = 'bool'

const VALID_IMAGE_TYPES = ['jpg', 'jpeg', 'svg', 'gif', 'png', 'webp', 'tiff']
const ANIM_MODE_PROGRESSIVE = 'progressive'
const ANIM_MODE_RANDOM = 'random'

module.exports = {
  ANIM_MODE_PROGRESSIVE,
  ANIM_MODE_RANDOM,
  options: {
    input: {
      short: 'i',
      required: true,
      arg: 'string',
      help: `input image path (supported image types: ${VALID_IMAGE_TYPES.join(', ')})`,
      type: TYPE_IMAGE_PATH
    },
    output: {
      short: 'o',
      required: true,
      arg: 'string',
      help: `output image path (supported image types: ${VALID_IMAGE_TYPES.join(', ')})`,
      type: TYPE_IMAGE_PATH
    },
    number: {
      short: 'n',
      default: 15,
      arg: 'int',
      help: 'number of primitives',
      type: TYPE_INT,
      validate: { min: 0 }
    },
    alpha: {
      short: 'a',
      default: 128,
      arg: 'int',
      help: 'alpha value for primitive',
      type: TYPE_INT,
      validate: { min: 1, max: 255 }
    },
    'resize-input': {
      aliases: ['resizeInput'],
      default: 128,
      arg: 'int',
      help: 'resize input images to this size',
      type: TYPE_INT,
      validate: { min: 8 }
    },
    'resize-output': {
      aliases: ['resizeOutput'],
      arg: 'int',
      help: 'output image size (default input image size)',
      type: TYPE_INT,
      validate: { min: 8 }
    },
    repeat: {
      short: 'r',
      default: 0,
      arg: 'int',
      help: 'add N extra shapes per iteration with reduced search',
      type: TYPE_INT,
      validate: { min: 0 }
    },
    frames: {
      short: 'f',
      default: 1,
      arg: 'int',
      help: 'if greater than 1 then output format should be gif and animation mode should equal "random", then this value is the number of repeated random frames',
      type: TYPE_INT,
      validate: { min: 1 }
    },
    fps: {
      default: 8,
      arg: 'int',
      help: 'frames per second for animated gif (if output format is not gif or frames equals 1 then ignored)',
      type: TYPE_INT,
      validate: { min: 1, max: 60 }
    },
    'animation-mode': {
      aliases: ['animationMode'],
      default: ANIM_MODE_RANDOM,
      arg: 'string',
      help: `animation mode for animated gif, can be "${ANIM_MODE_RANDOM}" or "${ANIM_MODE_PROGRESSIVE}", ignored for other output formats`,
      type: TYPE_STRING_OPTION,
      options: [ANIM_MODE_PROGRESSIVE, ANIM_MODE_RANDOM]
    },
    help: {
      short: 'h',
      type: TYPE_BOOLEAN,
      help: 'print this help message'
    },
    verbose: {
      short: 'v',
      type: TYPE_BOOLEAN,
      help: 'show application logs'
    },
    'very-verbose': {
      short: 'w',
      aliases: ['veryVerbose'],
      type: TYPE_BOOLEAN,
      help: 'show more application logs'
    }
  },

  parseArgs () {
    const args = mParseArgs(process.argv.slice(2), {
      alias: Object.keys(this.options).reduce((acc, key) => {
        if (this.options[key].short) acc[key] = [ this.options[key].short ]
        if (this.options[key].aliases) acc[key] = (acc[key] || []).concat(this.options[key].aliases)
        return acc
      }, {}),
      default: Object.keys(this.options).reduce((acc, key) => {
        if (this.options[key].default) acc[key] = this.options[key].default
        return acc
      }, {}),
      boolean: Object.keys(this.options).reduce((acc, key) => {
        if (this.options[key].type === TYPE_BOOLEAN) acc.push(key)
        return acc
      }, [])
    })
    return args
  },

  parseAndValidateConfig (config) {
    const args = Object.keys(this.options).reduce((acc, key) => {
      const value = config[key] || this.options[key].default
      if (value !== undefined) {
        acc[key] = value
        if (this.options[key].short) acc[this.options[key].short] = value
        if (this.options[key].aliases) this.options[key].aliases
          .forEach(alias => void (acc[alias] = value))
      }
      return acc
    }, JSON.parse(JSON.stringify(config)))
    args.outputExtension = Utils.getExtension(args.output)

    // throws error if invalid
    this.validateArgs(args)
    return args
  },

  validateArgs (args) {
    this.validateRequired(args)
    this.validateTypes(args)
    this.validateAnimationParams(args)
    return true
  },

  validateRequired (args) {
    const requiredOptionsDefined = Object.keys(this.options)
      .reduce((res, key) => res && (!this.options[key].required || args.hasOwnProperty(key)), true)
    if (!requiredOptionsDefined) {
      const missingOptions = Object.keys(this.options)
        .filter(key => this.options[key].required && !args.hasOwnProperty(key))
      throw new TypeError(`Missing required arguments (${missingOptions.map(v => `"${v}"`).join(', ')})`)
    }
  },

  validateTypes (args) {
    Object.keys(this.options).forEach(key => {
      if (args.hasOwnProperty(key) && this.options[key].type) {
        switch (this.options[key].type) {
          case TYPE_INT:
            if (!Utils.isInt(args[key]))
              throw new TypeError(`Argument "${key}" must be of the type integer`)
            if (this.options[key].validate) {
              const min = this.options[key].validate.min
              if (Utils.isInt(min) && args[key] < min)
                throw new TypeError(`Argument "${key}" must be greater than or equal to ${min}`)
              const max = this.options[key].validate.max
              if (Utils.isInt(max) && args[key] > max)
                throw new TypeError(`Argument "${key}" must be less than or equal to ${max}`)
            }
            break
          case TYPE_IMAGE_PATH:
            args[key] = String(args[key])
            const extension = Utils.getExtension(args[key])
            if (!VALID_IMAGE_TYPES.includes(extension))
              throw new TypeError(`Unsupported image type for argument "${key}"`)
            break
          case TYPE_STRING_OPTION:
            args[key] = String(args[key])
            if (!this.options[key].options.includes(args[key]))
              throw new TypeError(`Invalid argument "${key}"`)
            break
          case TYPE_BOOLEAN:
            args[key] = !!args[key]
            break
        }
      }
    })
  },

  validateAnimationParams (args) {
    if (args.frames > 1) {
      if (Utils.getExtension(args.output) !== 'gif') {
        throw new TypeError('More than 1 frame requested but output format is not gif')
      }
      if (args.animationMode !== ANIM_MODE_RANDOM) {
        throw new TypeError('More than 1 frame requested but animation mode is not "random"')
      }
    }
  },

  showUsage () {
    const requiredArgs = Object.keys(this.options)
      .filter(key => this.options[key].required)
    const optionalArgs = Object.keys(this.options)
      .filter(key => !this.options[key].required)

    let usage = 'node-primitive [options]'
    usage += ' ' + requiredArgs.map(key => (this.options[key].short ? `-${this.options[key].short}` : `--${key}`) + ` ${this.options[key].arg || key}`).join(' ')

    const toOptions = (keys) => keys.map(key => [
      (this.options[key].short ? `-${this.options[key].short}, ` : '') + `--${key} ${!this.options[key].boolean ? (this.options[key].arg || key) : ''}\n`,
      (this.options[key].help || '') + (this.options[key].default ? ` (default "${this.options[key].default}")` : '')
    ])

    const requiredOptions = toOptions(requiredArgs)
    const optionalOptions = toOptions(optionalArgs)
    const optionsTable = Table([
      {width: 25},
      {width: 60}
    ], [
      ...requiredOptions,
      ...optionalOptions
    ], {
      align: 'left',
      borderStyle: 0,
      marginTop: 0,
      compact: true,
      marginLeft: 0,
      paddingLeft: 0,
      paddingRight: 0,
      headerEmpty: true
    })

    let helpText = `Usage: ${usage}\n\n`
    helpText += 'Options:'
    helpText += optionsTable.render()
    console.log(helpText)
  }
}
