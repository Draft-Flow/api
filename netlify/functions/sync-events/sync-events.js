import fs from 'fs'
import {google} from 'googleapis'
import {formatISO, addMonths} from 'date-fns'
const { toHTML } = require('@portabletext/to-html')

export const handler = async (event, context) => {
  const eventBody = JSON.parse(event.body)
  const {title, _id: id, dates, content} = eventBody

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

  // Delete any events that are no longer in the course
  const eventsToDelete = calendarCourses.filter(course => course.extendedProperties?.shared?.['eventId'] === id && !dates.find(date => date._key === course.extendedProperties?.shared?.['key']))

  for (let i = 0; i < eventsToDelete.length; i++) {
    const event = eventsToDelete[i]
    await new Promise((resolve, reject) => {
      calendar.events.delete({
        auth: jwtClient,
        calendarId: process.env.GOOGLE_CAL_ID_COURSES,
        eventId: event.id
      }, async (err, res) => {
        if (err) {
          console.log('The API returned an error: ' + err)
          reject('The API returned an error: ' + err)
          return
        }
        resolve(res.data)
      })
    })
  }

  // Only include upcoming dates
  const upcomingDates = dates.filter(date => new Date(date.startDate) > new Date())

  for (let i = 0; i < upcomingDates.length; i++) {
    const event = upcomingDates[i]
    const eventData = {
      auth: jwtClient,
      calendarId: process.env.GOOGLE_CAL_ID_COURSES,
      resource: {
        summary: title,
        description: `<p><strong>-- DO NOT EDIT - IT WILL BE OVERWRITTEN --</strong></p>
          ${toHTML(content, {components: {}})}
        `,
        start: {
          dateTime: event.startDate
        },
        end: {
          dateTime: event.endDate
        },
        extendedProperties: {
          shared: {
            key: event._key,
            eventId: id
          }
        },
        attendees: [
          {
           email: "c_188a0b94t52lgg48ka6b7p78nf5r6@resource.calendar.google.com",
          },
          {
           email: "c_188ecr8dc2eaag2ejegq5htrgba80@resource.calendar.google.com",
           resource: true,
          }
        ],
      }
    }

    // Check if the event already exists
    const existingEvent = calendarCourses.find(course => course.extendedProperties?.shared?.['key'] === event._key)

     // If it exists, update the event
    if (existingEvent){
      eventData.eventId = existingEvent.id
      const updatedEvent = await new Promise((resolve, reject) => {
        calendar.events.update(eventData, async (err, res) => {
          if (err) {
            console.log('The API returned an error: ' + err)
            reject('The API returned an error: ' + err)
            return
          }
          resolve(res.data)
        })
      })
      console.log({updatedEvent})
    // Else create a new event
    } else  {
      const newEvent = await new Promise((resolve, reject) => {
        calendar.events.insert(eventData, async (err, res) => {
          if (err) {
            console.log('The API returned an error: ' + err)
            reject('The API returned an error: ' + err)
            return
          }
          resolve(res.data)
        })
      })
      console.log({newEvent})
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success'
    })
  }
}
