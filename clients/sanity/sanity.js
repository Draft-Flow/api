const {createClient} = require('@sanity/client')

export const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: !process.env.SANITY_READ_TOKEN,
  token: process.env.SANITY_READ_TOKEN,
  apiVersion: '2024-06-19',
})
