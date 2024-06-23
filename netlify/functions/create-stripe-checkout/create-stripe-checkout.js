const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const handler = async (event, context, callback) => {
  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Successful preflight call.' }),
    }
  }
  
  try {
    const groq = require('groq')
    const {sanityClient} = require('../../../clients/sanity/sanity')
    const data = JSON.parse(event.body)
    const {courseID, courseDate, page} = data

    const filter = groq`*[_type == "events" && _id == "${courseID}"][0]`
    const projection = groq`{
      "id": "_id",
      title,
      price,
      intro
    }`
    const query = [filter, projection].join(' ')
    const courseData = await sanityClient.fetch(query).catch((err) => {
      console.error(err)
    })

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

    const unitAmount = Number(courseData.price) * 100

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${courseData.title} - ${courseDate}`,
              description: courseData.intro, 
            },
            unit_amount: unitAmount,
            tax_behavior: 'inclusive'
          },
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: 10,
          },
          quantity: 1,
        },
      ],
      automatic_tax: {
        enabled: true,
      },
      success_url: `${page}/confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: page,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      phone_number_collection: {
        enabled: true,
      },
    })
  
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(session)
    }
  } catch (error) {
    console.log({error})

    return {
      statusCode: 400,
      body: JSON.stringify(error)
    }
  }
}
