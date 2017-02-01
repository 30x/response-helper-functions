'use strict'
const randomBytes = require('crypto').randomBytes
const INTERNAL_URL_PREFIX = 'scheme://authority'

function resultObject(func) {
  var status
  var headers
  return {
    writeHead: function(statusArg, headersArg) {
      status = statusArg
      headers = headersArg
    },
    end: function(body) {
      func(status, headers, body)
    }
  }
}

function methodNotAllowed(res, allow, body) {
  body = body || 'Method not allowed'
  body = JSON.stringify(body)
  res.writeHead(405, {'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(body),
                      'Allow': allow.join(', ') })
  res.end(body)
}

function notFound(res, body) {
  body = body || `Not Found. component: ${process.env.COMPONENT}`
  body = JSON.stringify(body)
  res.writeHead(404, {'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(body)})
  res.end(body)
}

function forbidden(res, body) {
  body = body || `Forbidden. component: ${process.env.COMPONENT}`
  body = JSON.stringify(body)
  res.writeHead(403, {'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(body)})
  res.end(body)
}

function unauthorized(res, body) {
  body = body || 'Unauthorized'
  body = JSON.stringify(body)
  res.writeHead(401, {'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(body)})
  res.end(body)
}

function badRequest(res, err) {
  var body = JSON.stringify(err)
  res.writeHead(400, {'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(body)})
  res.end(body)
}   

function internalError(res, err) {
  var body = JSON.stringify(err)
  res.writeHead(500, {'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(body)})
  res.end(body)
}   

function duplicate(res, err) {
  var body = JSON.stringify(err)
  res.writeHead(409, {'Content-Type': 'application/json',
                      'Content-Length': Buffer.byteLength(body)})
  res.end(body)
}   

function found(res, body, accept, location, etag) {
  var headers = {}
  if (location !== undefined)
    headers['Content-Location'] = externalizeURLs(location)
  if (etag !== undefined) 
    headers['Etag'] = etag
  respond(res, 200, headers, body, accept)
}

function created(res, body, accept, location, etag) {
  var headers =  {}
  if (location !== undefined)
    headers['Location'] = externalizeURLs(location)
  if (etag !== undefined)
    headers['Etag'] = etag 
  respond(res, 201, headers, body, accept)
}

function respond(res, status, headers, body, accept) {
  if (body !== undefined) {
    if (!(body instanceof Buffer)) {
      var wantsHTML = accept !== undefined && accept.startsWith('text/html')
      var contentType = headers['Content-Type']
      if (!contentType)
        contentType = headers['Content-Type'] = wantsHTML ? 'text/html' : 'application/json'
      externalizeURLs(body)
      body = contentType == 'text/html' ? toHTML(body) : contentType == 'application/json' ? JSON.stringify(body) : contentType == 'text/plain' ? body.toString() : body.toString()
    }
    headers['Content-Length'] = Buffer.byteLength(body)
  } 
  res.writeHead(status, headers)
  res.end(body)
}

function externalizeURLs(jsObject) {
  if (Array.isArray(jsObject))
    for (var i = 0; i < jsObject.length; i++)
      jsObject[i] = externalizeURLs(jsObject[i])
  else if (typeof jsObject == 'object') 
    for(var key in jsObject) {
      if (jsObject.hasOwnProperty(key)) 
        jsObject[key] = externalizeURLs(jsObject[key])
    }
  else if (typeof jsObject == 'string')
    if (jsObject.startsWith(INTERNAL_URL_PREFIX)) {
      return jsObject.substring(INTERNAL_URL_PREFIX.length)
    }
  return jsObject
}  

// The following function adapted from https://github.com/broofa/node-uuid4 under MIT License
// Copyright (c) 2010-2012 Robert Kieffer
var toHex = Array(256)
for (var val = 0; val < 256; val++) 
  toHex[val] = (val + 0x100).toString(16).substr(1)
function uuid4() {
  var buf = randomBytes(16)
  buf[6] = (buf[6] & 0x0f) | 0x40
  buf[8] = (buf[8] & 0x3f) | 0x80
  var i=0
  return  toHex[buf[i++]] + toHex[buf[i++]] +
          toHex[buf[i++]] + toHex[buf[i++]] + '-' +
          toHex[buf[i++]] + toHex[buf[i++]] + '-' +
          toHex[buf[i++]] + toHex[buf[i++]] + '-' +
          toHex[buf[i++]] + toHex[buf[i++]] + '-' +
          toHex[buf[i++]] + toHex[buf[i++]] +
          toHex[buf[i++]] + toHex[buf[i++]] +
          toHex[buf[i++]] + toHex[buf[i++]]
}
// End of section of code adapted from https://github.com/broofa/node-uuid4 under MIT License

exports.methodNotAllowed = methodNotAllowed
exports.notFound = notFound
exports.badRequest = badRequest
exports.duplicate = duplicate
exports.found = found
exports.ok = found
exports.created = created
exports.forbidden = forbidden
exports.unauthorized = unauthorized
exports.internalError = internalError
exports.resultObject = resultObject
exports.uuid4 = uuid4
exports.INTERNAL_URL_PREFIX = INTERNAL_URL_PREFIX
exports.externalizeURLs = externalizeURLs