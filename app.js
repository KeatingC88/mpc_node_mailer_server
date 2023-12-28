`use strict`
const path = require('path')
const express = require(`express`)
const cluster = require(`node:cluster`)
const totalCPUs = require("os").cpus().length
const bcrypt = require(`bcrypt`)
const puppeteer = require(`puppeteer`)
const nodemailer = require(`nodemailer`)
const axios = require(`axios`)
const port = 8081
//const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
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

    app.post("/api/send_confirmation_phone/:country/:telephone/:carrier", async (req, res) => {

        console.log(req.params.country + req.params.telephone + '@' + req.params.carrier)

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 't16790781@gmail.com',//nodejs!mpc || mpc!nodejs ? 
                pass: 'uimx sive ptrl iedq'//this would have to change too.
            }
        })

        const code = bcrypt.hashSync(req.params.carrier + req.params.telephone + req.params.country, 16)
        console.log(code)
        const mailOptions = {
            from: 't16790781@gmail.com',
            to: `${req.params.telephone}@${req.params.carrier}`,//${req.params.country}//does not work for some reason.
            subject: 'MPC Registration Phone',
            text: `Confirmation Link: http://localhost:3000/password?country=${req.params.country}&tel=${req.params.telephone}&carrier=${req.params.carrier}&code=${code}`
        }
/*
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
            } else {
                console.log('SMS sent: ' + info.response)
            }
        })
*/
        res.setHeader("Content-Type", "application/json")
        res.status(200)
        res.send(JSON.stringify(`${code}`))
    })

    app.post("/api/receive_confirmation_phone/:country/:telephone/:carrier/:code", async (req, res) => {
        res.setHeader("Content-Type", "application/json")
        if (!bcrypt.compareSync(req.params.carrier + req.params.telephone + req.params.country, req.params.code)) {
            res.status(401)
            res.send(false)
        } else {
            res.status(200)
            res.send(true)
        }
    })

    app.post("/api/send_confirmation_email/:to", async (req, res) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 't16790781@gmail.com',//mpc@gmail.com?
                pass: 'uimx sive ptrl iedq'//this would have to change too.
            }
        })

        const code = bcrypt.hashSync(req.params.to, 16)

        const mailOptions = {
            from: 't16790781@gmail.com',
            to: `${req.params.to}`,
            subject: 'MPC Registration Email',
            text: `Confirmation Link: http://localhost:3000/password?email=${req.params.to}&code=${code}`
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
                user: 't16790781@gmail.com',//mpc@gmail.com?
                pass: 'uimx sive ptrl iedq'//this would have to change too.
            }
        })

        const code = bcrypt.hashSync(req.params.to, 16)

        const mailOptions = {
            from: 't16790781@gmail.com',
            to: `${req.params.to}`,
            subject: 'MPC Registration Email',
            text: `Password Reset Link: http://localhost:3000/password?email=${req.params.to}&code=${code} this expires in 15 minutes.`
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
