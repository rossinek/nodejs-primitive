#!/usr/bin/env node
'use strict'

const Primitive = require('../lib/primitive')
Primitive.runCommandLineApp().then(status => process.exit(status))
