require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const Person = require('./models/person')

const app = express()

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError'){
    return response.status(400).send({ error: error.message })
  }

  next(error)
}

let persons = []
/*let persons = [
    { 
      "id": "1",
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": "2",
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": "3",
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": "4",
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]*/

app.use(express.static('dist'))
app.use(express.json())

morgan.token('body', (req) => {
    return JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/info', (request, response) => {
    const d = Date()
    Person.find({}).then(persons => {
        response.send(`<p>Phonebook has info for ${persons.length} people</p>
                       <p>${d}</p>`)
    })
    /* 
    //Para sacar la cantidad de personas en la lista sin BBDD implementada //
    response.send(`<p>Phonebook has info for ${persons.length} people</p>
                   <p>${d}</p>`)*/
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then((persons) => {
        response.json(persons)
    })
    // response.json(persons)
})

app.get('/api/persons/:id', (request, response, next) => {
    const id = request.params.id
    Person.findById(id)
        .then(person => {
            if(person){
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
    
    /*const person = persons.find((person) => person.id === id)

    if(person){
        response.json(person)
    } else {
        response.status(404).end()
    }*/
})

/*const generateId = () => {
    return String(Math.floor(Math.random() * 1000))
}*/

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    if(!body.name || !body.number){
        return response.status(400).json({
            error: 'content missing'
        })
    }

    /*
    // Para ver si ya hay un nombre igual, pero no se usa la base de datos //

    const name = persons.find(person => person.name === body.name)

    if(name){
        return response.status(400).json({
            error: 'name must be unique'
        })
    }

    // Para instertar nueva persona en la lista local (sin BBDD) //
    const person = {
        name: body.name,
        number: body.number,
        id: generateId()
    }

    persons = persons.concat(person)

    response.json(person)*/

    Person.findOne({name: body.name})
        .then(existingPerson => {
            if(existingPerson){
                return response.status(409)
                    .json({
                        error: 'name must be unique',
                        id: existingPerson._id
                    })
            }

            const person = new Person({
                name: body.name,
                number: body.number,
            })

            person.save().then((savedPerson) => {
                response.json(savedPerson)
            })
            .catch(error => next(error)) 

        })
        .catch(error => next(error)) 
})

app.put('/api/persons/:id', (request, response, next) => {
    const {name, number} = request.body

    Person.findById(request.params.id)
        .then(person => {
            if(!person){
                return response.status(404).end()
            }

            person.name = name
            person.number = number

            return person.save().then((updatedPerson) => {
                response.json(updatedPerson)
            })
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    const id = request.params.id

    /*
    // Para borrar una persona de la lista de forma local (sin BBDD) //

    persons = persons.filter((person) => person.id !== id)
    response.status(204).end()*/

    Person.findByIdAndDelete(id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
