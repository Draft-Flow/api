import fs from 'fs'
import {google} from 'googleapis'
import {formatISO, addMonths} from 'date-fns'

export const handler = async (event, context) => {
  const eventBody = JSON.parse(event.body)
  const {title, _id: id, dates, content} = eventBody

  const privatekey = JSON.parse(process.env.GOOGLE_KEY_FILE)
  const jwtClient = new google.auth.JWT(
    privatekey.client_email,
    null,
    privatekey.private_key,
    ['https://www.googleapis.com/auth/calendar']
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

  const calendarCourses = await new Promise((resolve, reject) => {
    calendar.events.list({
      auth: jwtClient,
      calendarId: process.env.GOOGLE_CAL_ID_COURSES,
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

      const coursesJSON = res.data.items
      resolve(coursesJSON)
    })
  })
  //console.log(calendarCourses)

  for (let i = 0; i < dates.length; i++) {
    const event = dates[i]
    const eventData = {
      auth: jwtClient,
      calendarId: process.env.GOOGLE_CAL_ID_COURSES,
      resource: {
        summary: title,
        description: JSON.stringify(content),
        start: {
          dateTime: event.startDate
        },
        end: {
          dateTime: event.endDate
        },
        extendedProperties: {
          shared: {
            key: event._key
          }
        }
      }
    }

    calendarCourses.map(course => console.log(course.extendedProperties.shared))

    const existingEvent = calendarCourses.find(course => course.extendedProperties.shared['key'] === event._key)   
    if (existingEvent){
      eventData.eventId = existingEvent.id
      calendar.events.update(eventData, async (err, res) => {
        if (err) {
          console.log('The API returned an error: ' + err)
          reject('The API returned an error: ' + err)
          return
        }
        resolve('Success ' + res.data)
      })
    } else  {
      const newEvent = await new Promise((resolve, reject) => {
        calendar.events.insert(eventData, async (err, res) => {
          if (err) {
            console.log('The API returned an error: ' + err)
            reject('The API returned an error: ' + err)
            return
          }
          resolve('Success ' + res.data)
        })
      })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success'
    })
  }
}
