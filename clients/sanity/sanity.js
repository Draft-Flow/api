const sanityClient = require('@sanity/client')

const { sanity } = require('./config')

module.exports = sanityClient({
  ...sanity,
  useCdn: !process.env.SANITY_READ_TOKEN,
  token: process.env.SANITY_READ_TOKEN,
  apiVersion: '2022-05-10',
})
