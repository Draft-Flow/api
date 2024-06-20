// import Stripe from ('stripe')
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
import {google} from 'googleapis'

export const handler = async (event, context, callback) => {
  const data = JSON.parse(event.body)
  
  // try {
  //   const session = await stripe.checkout.sessions.create({
  //     mode: 'payment',
  //     line_items: [
  //       {
  //         price_data: {
  //           currency: 'gpb',
  //           product_data: {
  //             name: 'Course',
  //           },
  //           unit_amount: 2000,
  //         },
  //         adjustable_quantity: {
  //           enabled: true,
  //           minimum: 1,
  //           maximum: 10,
  //         },
  //         quantity: 1,
  //       },
  //     ],
  //     automatic_tax: {
  //       enabled: true,
  //     },
  //     success_url: `${process.env.URL}/course-confirmed?session_id={CHECKOUT_SESSION_ID}`,
  //     cancel_url: process.env.URL,
  //     billing_address_collection: 'required',
  //     shipping_address_collection: {
  //       allowed_countries: ['GB'],
  //     }
  //   })
  
    return {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      statusCode: 200,
      // body: JSON.stringify(session)
      body: JSON.stringify('session')
    }
  // } catch (error) {
  //   return {
  //     statusCode: 400,
  //     body: error.type,
  //   }
  // }
}
