require('dotenv').config()
console.log('MONGODB_URI:', process.env.MONGODB_URI)
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./models/person')


morgan.token('body', (req) => JSON.stringify(req.body)) //  he quitado 'res' para evitar el warning de no usar la variable

const mongoose = require('mongoose')

// const password = process.argv[2] // ya se utiliza en persons.js

// const url = `mongodb+srv://fullstackopen:${password}@cluster0.vvyub.mongodb.net/phonebookApp?retryWrites=true&w=majority&appName=Cluster0`
// // ya se utiliza en persons.js

mongoose.set('strictQuery',false)

app.use(express.static('dist'))
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.use((req, res, next) => {
  console.log('Middleware JSON:', req.headers['content-type'])
  console.log('Body recibido:', req.body)
  next()
})

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    console.error('Error de validación:', error)  // esto para ver el error completo
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(cors())
app.use(requestLogger)

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(person => {
    response.json(person)
  })
})

app.get('/info', (request, response, next) => {
  const currentTime = new Date()

  Person.countDocuments({})
    .then(count => {
      response.send(`
        <p>Phonebook has info for ${count} people</p>
        <p>${currentTime}</p>
      `)
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => { // he cambiado 'result' por '()'
      response.status(204).end()
    })
    .catch(error => next(error))
})

const updatedPerson = (name, id, number, response, next) => {
  Person.findByIdAndUpdate(
    id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      if (!updatedPerson) {
        return response.status(404).json({ error: 'Person not found' })
      }
      response.json(updatedPerson)
    })
    .catch(error => next(error))
}

app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body

  if (!name || !number) {
    return response.status(400).json({
      error: 'name or number is missing'
    })
  }

  Person.findOne({ name })
    .then(existingPerson => {
      if (existingPerson) {
        // Si la persona ya existe, actualizar el número
        return updatedPerson(existingPerson.name, existingPerson.id, number, response, next)
      }

      // Si la persona no existe, se crea una nueva
      const person = new Person({ name, number })
      return person
        .save()
        .then(savedPerson => response.json(savedPerson))
        .catch(error => next(error))
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body

  if (!name || !number) {
    return response.status(400).json({ error: 'name or number is missing' })
  }

  updatedPerson(name, request.params.id, number, response, next)
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})