require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./models/person')


morgan.token('body', (req, res) => JSON.stringify(req.body))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

const mongoose = require('mongoose')

const password = process.argv[2]

const url = `mongodb+srv://fullstackopen:${password}@cluster0.vvyub.mongodb.net/phonebookApp?retryWrites=true&w=majority&appName=Cluster0`

mongoose.set('strictQuery',false)
mongoose.connect(url)

app.use(express.static('dist'))

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(express.json())
app.use(cors())
app.use(requestLogger)

app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(person => {
    response.json(person)
  })
})

app.get('/info', (request, response) => {
  const currentTime = new Date();
  const numberOfPersons = persons.length;

  response.send(`
    <p>Phonebook has info for ${numberOfPersons} people</p>
    <p>${currentTime}</p>
  `);
});

app.get('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)   
  
  if (person) {
      response.json(person)
  } else {
      response.status(404).end()
  }
})

app.delete('/api/persons/:id', (request, response) => {
  const id = Number(request.params.id)
  persons = persons.filter(person => person.id !== id)

  response.status(204).end()
})

app.post('/api/persons', (request, response) => {
  const body = request.body;

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'name or number is missing'
    });
  }

  Person.findOne({ name: body.name }).then(existingPerson => {
    if (existingPerson) {
      return response.status(400).json({
        error: 'name must be unique'
      });
    }

    const person = new Person({
      name: body.name,
      number: body.number
    });

    person.save().then(savedPerson => {
      response.json(savedPerson);
    });
  });
});

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})