`use strict`
const express = require(`express`)
const cluster = require(`node:cluster`)
const totalCPUs = require("os").cpus().length
const bcrypt = require(`bcrypt`)//must be uninstalled locally before putting into a docker container (so docker maps inside of docker).
const nodemailer = require(`nodemailer`)
const port = 3001
const client_address = `http://localhost:6499`

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

    app.get('*', async (req, res) => {
        await res.send(JSON.stringify(`Server Ready...`))
    })

    app.post("/api/send_confirmation_phone/:country/:telephone/:carrier", async (req, res) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 't16790781@gmail.com',//nodejs!mpc || mpc!nodejs ? 
                pass: 'uimx sive ptrl iedq'//this would have to change too.
            }
        })

        const code = bcrypt.hashSync(req.params.carrier + req.params.telephone + req.params.country, 16)

        const mailOptions = {
            from: 't16790781@gmail.com',
            to: `${req.params.telephone}@${req.params.carrier}`,//${req.params.country}//does not work for some reason.
            subject: 'MPC Account Confirmation URL',
            text: `${client_address}/password?country=${req.params.country}&tel=${req.params.telephone}&carrier=${req.params.carrier}`
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

    app.post("/api/Send/Confirmation/Email/:language/:to", async (req, res) => {
        const verification_access_code = bcrypt.hashSync(req.params.to, 16)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 't16790781@gmail.com',//mpc@gmail.com
                pass: 'uimx sive ptrl iedq'//this would have to change too.
            }
        })
        transporter.sendMail({
                from: 't16790781@gmail.com',
                to: `${req.params.to}`,
                subject: 'MPC Account Registration Email',
            text: `Confirmation Link: ${client_address}/password?language=${req.params.language}&email=${req.params.to}&code=${verification_access_code}`
            }, (error, info) => {
            if (error) { console.error(error) }
        })
        res.setHeader("Content-Type", "application/json")
        res.status(200)
        res.send(JSON.stringify(`${verification_access_code}`))
    })

    app.get("/api/receive_confirmation_email/:email", async (req, res) => {//Change Language: Email: and get the language code from the URL when it was sent to someone's inbox.
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
            text: `Password Reset Link: ${client_address}/password?email=${req.params.to}&code=${code} this expires in 15 minutes.`
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

    app.listen(port, () => console.log(`NodeMailer Server: a CPU Core is listening on PORT ${port}`))
}