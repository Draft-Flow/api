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
    const sanity = require('../../../client/sanity/sanity')
    const data = JSON.parse(event.body)
    const {courseid: courseID, coursedate: courseDate} = data

    const filter = groq`*[_type == "events" && _id == "${courseID}"]`
    const projection = groq`{
      "id": "_id",
      title,
      price
    }`
    const query = [filter, projection].join(' ')
    const courseData = await sanity.fetch(query).catch((err) => {
      console.error(err)
    })

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${courseData.title} - ${courseDate}`,
              description: 
            },
            unit_amount: courseData.price * 100,
            tax_behavior: 'inclusive',
            tax_code: 'txcd_20060044'
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
      success_url: `${process.env.URL}/course-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.URL,
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
