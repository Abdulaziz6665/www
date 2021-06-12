const express = require('express')
const { pg } = require('./pg/pg')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 4600

app.use(express.json())

app.use(express.static(path.join(__dirname, '..', 'build')))
// app.use(express.static(__dirname, '..', 'public'))

// app.use((req, res, next) => {
//     res.sendFile(path.join(__dirname, '..', 'build', 'index.html'))
// })

const SQL = `
    select
        user_username,
        user_password
    from 
        users
;
`
const INSERT = `
    insert into users (user_username, user_password) values ($1, crypt($2, gen_salt('bf'))) returning user_id
    ;
`

const INSERT_CONTACTS = `
    insert into user_contacts(user_username, user_phone, user_email, contacts_id) values ($1, $2, $3, $4)
    ;
`
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Headers', '*')
    next()
}) 

const FIND_USER = `
    select
        user_id
    from 
        users
    where user_username = $1 and user_password = crypt($2, user_password);
`

const FIND_USER_CONTACTS = `
    select distinct
        c.user_username,
        c.user_phone,
        c.user_email
    from
        user_contacts as c
    join users as u on $1 = c.contacts_id
    order by c.user_username
`

app.get('/signup', async (req, res) => {
    res.send(await pg(SQL))
})


app.post('/signup', async (req, res) => {
    const { username, password } = req.body
    
    try {
        const response = await pg(INSERT, username, password)
        return res.send({succes: true, json: response[0]})
    } catch (e) {
        console.log(e.message)
        return res.send({mass: 'User alreary exits'})
    }
    
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body
    
    try {
        const result = await pg(FIND_USER, username, password)
        return res.send({res: result[0], succes: true, mass: 'user not found'})
    } catch (e) {
        console.log(e.message)
        return res.send({mass: 'User alreary exits'})
    }
})

app.post('/contacts', async (req, res) => {
    
    const {data, name, phone, email } = req.body

    
    try {
        if (name && phone) {
            await pg(INSERT_CONTACTS, name, phone, email, data.user_id)
        }
            const result = await pg(FIND_USER_CONTACTS, data.user_id)
            res.send(result)
     } catch (e) {
            console.log(e.message)
     }
})

app.listen(PORT, () => console.log('server is running ' + PORT))