`use strict`
const express = require(`express`)
const cluster = require(`node:cluster`)
const os_cpu_count = require("os").cpus().length
const bcrypt = require(`bcrypt`)//must be uninstalled locally before putting into a docker container (so docker maps inside of docker).
const nodemailer = require(`nodemailer`)
const crypto = require('crypto')
const client_address = `http://localhost:6499`
const port = 3001
const SECRET_KEY = "z0nz0fb!gb0sz664"

// Encrypt function for AES-128 (16-byte key)
const Encrypt = (value) => {
    const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(SECRET_KEY, 'utf-8').slice(0, 16), null);
    let encrypted = cipher.update(value, 'utf-8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

// Decrypt function for AES-128 (16-byte key)
const Decrypt = (value) => {
    const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(SECRET_KEY, 'utf-8').slice(0, 16), null);
    let decrypted = decipher.update(value, 'base64', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

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

    app.post("/api/Send/Confirmation/Email/", async (req, res) => {
        let email_address = await Decrypt(req.body.email_address)
        let language = await Decrypt(req.body.language)
        let region = await Decrypt(req.body.region)
        const verification_access_code = await bcrypt.hashSync(email_address, 16)

        const transporter = await nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 't16790781@gmail.com',//mpc@gmail.com in .env file
                pass: 'uimx sive ptrl iedq'//this would have to change too.
            }
        })

        await transporter.sendMail({
            from: 't16790781@gmail.com',
            to: `${email_address}`,
            subject: 'MPC Account Registration Email',
            text: `Confirmation Link: ${client_address}/password?language=${language}-${region}&email=${email_address}&code=${verification_access_code}`
        }, (error, info) => {
            if (error) {
                res.setHeader("Content-Type", "application/json")
                res.status(500)
                res.json({ error: `unable to send email.`})
            }
        })

        res.setHeader("Content-Type", "application/json")
        res.status(200)
        res.json({code: `${verification_access_code}`})
    })

    app.post("/api/Received/Confirmation/Email/", async (req, res) => {
        res.setHeader("Content-Type", "application/json")
        let email_address = await Decrypt(req.body.email_address)
        console.log(email_address)
        if (!bcrypt.compareSync(email_address, req.body.code)) {
            res.status(401)
            res.json(false)
        } else {
            res.status(200)
            res.json(true)
        }
    })
    
    app.listen(port, () => console.log(`NodeMailer Server: a CPU Core is listening on PORT ${port}`))
}