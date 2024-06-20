export const handler = async function(event, context, callback) {
  const stripe = require('stripe')(process.env.STRIPE_SECRET)
  const data = JSON.parse(event.body)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: 1000,
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
}
