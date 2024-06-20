export const handler = async function(event, context, callback) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  const data = JSON.parse(event.body)
  
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'gpb',
            product_data: {
              name: 'Course',
            },
            unit_amount: 2000,
            tax_behavior: 'inclusive',
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
      }
    })
  
    return {
      statusCode: 200,
      body: JSON.stringify(session)
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: error.type,
    }
  }
}
