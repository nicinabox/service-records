const path = require('path')
const express = require('express')
const proxy = require('http-proxy-middleware')
const apiProxy = require('./api-proxy')

const isProduction = process.env.NODE_ENV === 'production'
const PORT = process.env.PORT || 8080
const ONE_YEAR = 31557600000

const app = express()

const handler = (filename) => (req, res) => res.sendFile(path.join(__dirname, `../public/${filename}.html`))

app.use('/', express.static(path.join(__dirname, '../public/'), { maxAge: ONE_YEAR }))
app.use('/api', apiProxy)

if (!isProduction) {
  const assetProxy = proxy({
    target: `http://localhost:${PORT - 1}`,
    changeOrigin: true
  })
  app.use('/bundle.js*', assetProxy)
  app.use('/style.css*', assetProxy)
}

app.get('/apple-app-site-association', (req, res) => {
  res.set('Content-Type', 'application/pkcs7-mime')
  res.send(require('./apple-app-site-association.json'))
})

app.get('/terms', handler('terms'))
app.get('/*', handler('index'))

if (isProduction) {
  app.listen(PORT)
} else {
  const webpack = require('./webpack')

  webpack.listen(PORT - 1, 'localhost', () => {})
  app.listen(PORT)
}

console.log('Magic happens on port ' + PORT) // eslint-disable-line
