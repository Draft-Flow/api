import fs from 'fs'
import {google} from 'googleapis'
import {formatISO, addMonths} from 'date-fns'

export const handler = async (event, context) => {
  const eventBody = JSON.parse(event.body)
  const {calendarID} = eventBody
  console.log({calendarID})
  const privatekey = JSON.parse(process.env.GOOGLE_KEY_FILE)
  const jwtClient = new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
    ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    "brett@draftandflow.com"
  )
  
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log({err});
      return
    } else {
      console.log("Successfully connected!");
    }
    }
  )

  const calendar = google.calendar('v3')

  const bikeRentals = await new Promise((resolve, reject) => {
    calendar.events.list({
      auth: jwtClient,
      calendarId: calendarID,
      timeMin: formatISO(new Date()),
      timeMax: formatISO(addMonths(new Date(), 12)),
      showDeleted: false,
      maxResults: 1000,
      singleEvents: true,
      orderBy: 'startTime',
    }, async (err, res) => {
      if (err) {
        console.log('The API returned an error: ' + err)
        reject('The API returned an error: ' + err)
        return
      }

      const bikeRentals = res.data.items
      resolve(bikeRentals)
    })
  })
  

  return {
    statusCode: 200,
    body: JSON.stringify(bikeRentals)
  }
}
