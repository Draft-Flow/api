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
    const data = JSON.parse(event.body)
    const {selectedTimes, page} = data

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: 'price_1PWRGmGzWQ51ogSj1OO610PE',
          quantity: selectedTimes.length,
        },
      ],
      metadata: {
        selectedTimes: JSON.stringify(selectedTimes),
      },
      allow_promotion_codes: true,
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
