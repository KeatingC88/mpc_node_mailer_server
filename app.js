`use strict`
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
const path = require('path')
const express = require("express")
const cluster = require(`node:cluster`)
const totalCPUs = require("os").cpus().length
const bcrypt = require('bcrypt')
const nodemailer = require("nodemailer")
const port = 8081

if (cluster.isPrimary) {
    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork()
    }
    cluster.on('exit', (worker, code, signal) => {
        cluster.fork()
    })
} else {
    const app = express()
    app.use(express.static('client/build'))
    app.use(express.json())
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE")
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        next()
    })

    app.get('*', (req, res) => {
        res.send(JSON.stringify(`Server Ready...`))
    })

    app.post("/api/send_confirmation_email/:to", async (req, res) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'keatingc88@gmail.com',//mpc@gmail.com?
                pass: 'xmzt eobz jzji mysm'//this would have to change too.
            }
        })

        const code = bcrypt.hashSync(req.params.to, 16)

        const mailOptions = {
            from: 'keatingc88@gmail.com',
            to: `${req.params.to}`,
            subject: 'MPC Registration Email',
            text: `Confirmation Link: http://localhost:3000/RegisterComplete?email=${req.params.to}&code=${code}`
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response)
            }
        })

        res.setHeader("Content-Type", "application/json")
        res.status(200)
        res.send(JSON.stringify(`${code}`))
    })

    app.post("/api/receive_confirmation_email/:email", async (req, res) => {
        res.setHeader("Content-Type", "application/json")
        if (!bcrypt.compareSync(req.params.email, req.query.code)) {
            res.status(401)
            res.send(false)
        } else {
            res.status(200)
            res.send(true)
        }
    })

    app.post("/api/email_reset_password/:to", async (req, res) => {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'keatingc88@gmail.com',//mpc@gmail.com?
                pass: 'xmzt eobz jzji mysm'//this would have to change too.
            }
        })

        const code = bcrypt.hashSync(req.params.to, 16)

        const mailOptions = {
            from: 'keatingc88@gmail.com',
            to: `${req.params.to}`,
            subject: 'MPC Registration Email',
            text: `Password Reset Link: http://localhost:3000/PasswordReset?email=${req.params.to}&code=${code} this expires in 15 minutes.`
        }

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log('Email sent: ' + info.response)
            }
        })

        res.setHeader("Content-Type", "application/json")
        res.status(200)
        res.send(JSON.stringify(`Email password reset has been sent to ${req.params.to}!`))
    })

    app.listen(port, () => console.log(`Server is running successfully on PORT ${port}`))
}
/*if (isMainThread) {

    const app = express()
    app.get('*', (req, res) => {
        res.send(JSON.stringify(`Server Listening on PORT ${port}...`))
        console.log(`foobar`)
    })
    app.listen(port, () => console.log(`Server is running successfully on PORT ${port}`))

    for (let i = 0; i <= totalCPUs - 1; i++) {
        new Worker(__filename, { workerData: [i] }).on(`message`, msg => {
            console.log(` in message area ... ${msg.id}`)
        })
    }

} else {
    const [id] = workerData
    console.log(`${id} in worker thread area`)



    parentPort.postMessage({id: id})
    process.exit()
}*/


/*if (cluster.isPrimary) {

    const app = express()
    app.get('*', (req, res) => {
        res.send(JSON.stringify(`Server Listening on PORT ${port}...`))
        console.log(`foobar`)
    })
    app.listen(port, () => console.log(`Server is running successfully on PORT ${port}`))

    for (let i = 0; i < totalCPUs; i++) {
        var worker = cluster.fork()
        worker.send({id: i})
        console.log(`Cluster: ${i} has loaded.`)        
    }
} else {
    process.on(`message`, ({ id }) => {

        console.log(`workerID: ${id}`)
        process.send({id: id})
        process.exit()

    })
}*/


/*const app = express()
app.use(express.static('client/build'))
app.use(express.json())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
})



app.get('*', (req, res) => {
    res.send(JSON.stringify(`Server Ready...`))
})

app.post("/api/confirmation_email/:to", async (req, res) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'keatingc88@gmail.com',//mpc@gmail.com?
            pass: 'xmzt eobz jzji mysm'//this would have to change too.
        }
    })

    let code = bcrypt.hashSync(req.params.to, 16)
    console.log(`Emailing to ${req.params.to} and returning Code:${code}...\n`)

    var mailOptions = {
        from: 'keatingc88@gmail.com',
        to: `${req.params.to}`,
        subject: 'MPC Registration Email',
        text: `Confirmation Link: http://localhost:3000/RegisterComplete?email=${req.params.to}&code=${code}`
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })

    res.setHeader("Content-Type", "application/json")
    res.status(200)
    res.send(JSON.stringify(`${code}`))
})

app.post("/api/email_check_in/:email/:code", async (req, res) => {

    console.log(req.params.email)
    console.log(req.params.code)
    console.log(bcrypt.compareSync(`${req.params.email}`, `${req.params.code}`))

    if (!bcrypt.compareSync(`${req.params.email}`, `${req.params.code}`)) {
        console.log(`carter`)
        res.setHeader("Content-Type", "application/json")
        res.status(401)
        res.send(false)
    } else {
        console.log(`lee`)
        res.setHeader("Content-Type", "application/json")
        res.status(200)
        res.send(true)
    }
})

app.post("/api/reset_password/:to", async (req, res) => {



    res.setHeader("Content-Type", "application/json")
    res.status(200)
    res.send(JSON.stringify(`Email password reset has been sent to ${req.params.to}!`))

})

app.listen(port, () => console.log(`Server process ID ${process.pid} is running successfully on PORT ${port}`))*/

/*const app = express()
app.use(express.static('client/build'))
app.use(express.json())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
})



app.get('*', (req, res) => {
    res.send(JSON.stringify(`Server Ready...`))
})

app.listen(port, () => console.log(`Server is running successfully on PORT ${port}`))*/



/*if (isMainThread) {
    console.log(`main thread began with cpus.`)

    const app = express()
    app.listen(port, () => console.log(`Server is running successfully on PORT ${port}`))

    for (let i = 0; i <= totalCPUs; i++) {
        new Worker(__filename, { workerData: [i] }).on(`message`, obj => {

            //console.log(`${obj.id} -- ${obj.message} has finished`)
            console.log(`${obj.id} finished`)

        })
    }
} else {
    const [id] = workerData
    //const obj = { id: id, message: "message" }
    //console.log(`${id} has begun`)


    parentPort.postMessage({id: id})
    process.exit()
}*/


/*if (cluster.isPrimary) {
    for (let i = 0; i < totalCPUs; i++) {
        var worker = cluster.fork()
        //worker.send({id: i, pid: worker.process.pid})
        worker.send({id: i})
        console.log(`Cluster: ${i} has loaded.`)
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`${worker.process.pid} has exited`)
        cluster.fork()
        //worker.send({ id: i })
    })
} else {
    process.on(`message`, ({ id }) => {
        console.log(`workerID: ${id}`)
        process.exit()
    })
}*/


/*
     */