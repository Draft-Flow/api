const {createClient} = require('@sanity/client')

console.log( process.env.SANITY_PROJECT_ID, process.env.SANITY_DATASET)

module.exports = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: !process.env.SANITY_READ_TOKEN,
  token: process.env.SANITY_READ_TOKEN,
  apiVersion: '2024-06-19',
})
