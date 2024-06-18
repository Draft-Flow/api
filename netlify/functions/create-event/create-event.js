export const handler = async (event, context) => {
  const eventBody = JSON.parse(event.body)
  console.log(eventBody)
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello world!'
    })
  }
}
