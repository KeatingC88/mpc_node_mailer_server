`use strict`
const express = require(`express`)
const cluster = require(`node:cluster`)
const os_cpu_count = require("os").cpus().length
const bcrypt = require(`bcrypt`)//must be uninstalled locally before putting into a docker container (so docker maps inside of docker).
const nodemailer = require(`nodemailer`)
const port = 3001
const client_address = `http://localhost:6499`

if (cluster.isPrimary) {
    for (let i = 0; i < os_cpu_count; i++) {
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
        await res.send(JSON.stringify(`Ready...`))
    })

    app.post("/api/Send/Confirmation/Email/:language_region/:to", async (req, res) => {
        const verification_access_code = bcrypt.hashSync(req.params.to, 16)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 't16790781@gmail.com',//mpc@gmail.com in .env file
                pass: 'uimx sive ptrl iedq'//this would have to change too.
            }
        })
        transporter.sendMail({
            from: 't16790781@gmail.com',
            to: `${req.params.to}`,
            subject: 'MPC Account Registration Email',
            text: `Confirmation Link: ${client_address}/password?language=${req.params.language_region}&email=${req.params.to}&code=${verification_access_code}`
        }, (error, info) => {
            if (error) { console.error(error) }
        })
        res.setHeader("Content-Type", "application/json")
        res.status(200)
        res.json({code: `${verification_access_code}`})
    })

    app.get("/api/Received/Confirmation/Email/:email", async (req, res) => {
        res.setHeader("Content-Type", "application/json")
        if (!bcrypt.compareSync(req.params.email, req.query.code)) {
            res.status(401)
            res.json(false)
        } else {
            res.status(200)
            res.json(true)
        }
    })
    
    app.listen(port, () => console.log(`NodeMailer Server: a CPU Core is listening on PORT ${port}`))
}