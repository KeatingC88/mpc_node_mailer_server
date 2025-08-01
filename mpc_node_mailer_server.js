`use strict`
require('dotenv').config()
const os = require("os")
const os_cpu_count = os.cpus().length
const express = require(`express`)
const cluster = require(`node:cluster`)
const bcrypt = require(`bcrypt`)
const nodemailer = require(`nodemailer`)
const crypto = require('crypto')

const redirect_client_url_address = process.env.CLIENT_ADDRESS_DEV
const network_socket_port = process.env.SERVER_PORT

let network_ip_address = `auto`//127.0.0.1

const encryption_key = process.env.ENCRYPTION_KEY
const encryption_type = process.env.ENCRYPTION_TYPE
const encryption_format = process.env.ENCRYPTION_FORMAT
const encryption_base = process.env.ENCRYPTION_BASE
const encryption_iv = process.env.ENCRYPTION_IV
const encryption_hash = process.env.ENCRYPTION_HASH

const Decrypt = (value) => {
    const key = crypto.createHash(`${encryption_hash}`).update(`${encryption_key}`, `${encryption_format}`).digest()
    const iv = Buffer.from(`${encryption_iv}`, `${encryption_format}`)
    const decipher = crypto.createDecipheriv(`${encryption_type}`, key, iv)
    let decrypted = decipher.update(value, `${encryption_base}`, `${encryption_format}`)
    decrypted += decipher.final(`${encryption_format}`)
    return decrypted
}

const get_hardware_ethernet_local_ip_address = () => {
    const networkInterfaces = os.networkInterfaces()
    for (const interfaceName in networkInterfaces) {
        if (interfaceName.toLowerCase().includes('eth') || interfaceName.toLowerCase() === 'ethernet') {
            for (const networkInterface of networkInterfaces[interfaceName]) {
                if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
                    return networkInterface.address
                }
            }
        }
    }
    return null
}

try {

    if (network_ip_address === `auto`)
        network_ip_address = `${get_hardware_ethernet_local_ip_address()}`

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

            let verification_access_code = await bcrypt.hashSync(email_address, 16)

            do {
                if (verification_access_code.charAt(verification_access_code.length - 1) === ".") {
                    verification_access_code = await bcrypt.hashSync(email_address, 16);
                }
            } while (verification_access_code.charAt(verification_access_code.length - 1) === ".")

            const transporter = await nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: `${process.env.NODE_MAILER_USER}`,
                    pass: `${process.env.NODE_MAILER_PASSWORD}`
                }
            })

            await transporter.sendMail({
                from: `${process.env.NODE_MAILER_USER}`,
                to: `${email_address}`,
                subject: 'MPC Account Registration Email',
                text: `Confirmation Link: http://${redirect_client_url_address}/Register/Email/Password?language=${language}-${region}&email=${email_address}&code=${verification_access_code}`
            }, (error, info) => {
                if (error) {
                    res.setHeader("Content-Type", "application/json")
                    res.status(500)
                    res.json({ error: `unable to send email.` })
                }
            })

            res.setHeader("Content-Type", "application/json")
            res.status(200)
            res.json({ code: `${verification_access_code}` })
        })

        app.post("/api/Send/Notification/Email/", async (req, res) => {

            let email_address = await Decrypt(req.body.email_address)
            let language = await Decrypt(req.body.language)
            let region = await Decrypt(req.body.region)
            const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress
            let client_time = await Decrypt(req.body.client_time)
            let location = await Decrypt(req.body.location)
            let user_agent = await Decrypt(req.body.user_agent)

            const transporter = await nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: `${process.env.NODE_MAILER_USER}`,
                    pass: `${process.env.NODE_MAILER_PASSWORD}`
                }
            })

            await transporter.sendMail({
                from: `${process.env.NODE_MAILER_USER}`,
                to: `${email_address}`,
                subject: 'MPC Account Registration Attempt',
                text: `There's been an attempt to re-register your email account from 
                        \nIP Address: ${ip_address}
                        \nLanguage: ${language}
                        \nRegion: ${region}
                        \nDevice Time Captured: ${new Date(parseInt(client_time)).toISOString()}
                        \nLocation: ${location}
                        \nDevice Information: ${user_agent}
                        \nNotify an Admin if the issue persists and was NOT you at {website}.`
            }, (error) => {
                
            })
            res.status(200)
            res.json(true)
        })

        app.post("/api/Received/Confirmation/Email/", async (req, res) => {
            res.setHeader("Content-Type", "application/json")
            let email_address = await Decrypt(req.body.email_address)
            if (!bcrypt.compareSync(email_address, req.body.code)) {
                res.status(401)
                res.json(false)
            } else {
                res.status(200)
                res.json(true)
            }
        })

        app.listen(network_socket_port, network_ip_address, () => console.log(`Node Mailer Server:\na CPU Core is listening on \nNetwork IP Address ${network_ip_address} \nNetwork Socket Port ${network_socket_port}\nClient Address ${redirect_client_url_address}`))
    }
} catch (err) {
    console.error('Server Startup Error: ', err)
}
