import fs from 'fs'
import {google} from 'googleapis'
import {format, formatISO, addDays, addMonths} from 'date-fns'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const handler = async (event, context) => {
  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Successful preflight call.' }),
    }
  }

  const eventBody = JSON.parse(event.body)
  const {calendarID} = eventBody

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

  // Create daily time slots
  const timeSlots = []
  for (let i = 1; i < 90; i++) {
    const date = addDays(new Date(), i)
    // Create morning and afternoon time slots
    const morningStartTime = `${format(date, "yyyy-MM-dd")}T09:00:00`
    const morningEndTime = `${format(date, "yyyy-MM-dd")}T13:00:00`
    // Create afternoon time slots
    const afternoonStartTime = `${format(date, "yyyy-MM-dd")}T14:00:00`
    const afternoonEndTime = `${format(date, "yyyy-MM-dd")}T18:00:00`
    timeSlots.push({
      start: morningStartTime,
      end: morningEndTime
    },
    {
      start: afternoonStartTime,
      end: afternoonEndTime
    })
  }

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

  // Remove time slots that are already booked
  for (let i = 0; i < bikeRentals.length; i++) {
    const bikeRental = bikeRentals[i]
    const bikeRentalStart = bikeRental.start.dateTime
    const bikeRentalEnd = bikeRental.end.dateTime
    timeSlots = timeSlots.filter(timeSlot => {
      return (timeSlot.start < bikeRentalStart && timeSlot.end < bikeRentalStart) || (timeSlot.start > bikeRentalEnd && timeSlot.end > bikeRentalEnd)
    })
  }
  
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({bikeRentals, timeSlots})
  }
}
