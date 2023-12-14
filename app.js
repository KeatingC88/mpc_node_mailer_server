`use strict`
const express = require("express")
const path = require('path')
const cluster = require(`node:cluster`)
const bcrypt = require('bcrypt')
const totalCPUs = require("os").cpus().length
const nodemailer = require("nodemailer")
const port = 8081
           
if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`)
    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork()
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`${worker.process.pid} has exited`)
        cluster.fork()
    })
} else {
    const app = express()
    app.use(express.static('client/build'));
    app.use(express.json())
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        next();
    });

    app.get('*', (req, res) => {
        res.send(JSON.stringify(`Server Ready...`))
    });

    app.post("/api/confirmation_email/:to", async (req, res) => {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'keatingc88@gmail.com',//mpc@gmail.com?
                pass: 'xmzt eobz jzji mysm'//this would have to change too.
            }
        });
        let code = bcrypt.hashSync(req.params.to, 16)
        var mailOptions = {
            from: 'keatingc88@gmail.com',
            to: `${req.params.to}`,
            subject: 'MPC Registration Email',
            text: `Confirmation Link: https://localhost:7202/${code}`//What should this be????
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.setHeader("Content-Type", "application/json")
        res.status(200)
        res.send(JSON.stringify(`${code}`))
    });

    app.post("/api/reset_password/:to", async (req, res) => {



        res.setHeader("Content-Type", "application/json")
        res.status(200)
        res.send(JSON.stringify(`Email password reset has been sent to ${req.params.to}!`))
    });

    app.listen(port, () => console.log(`Server ${process.pid} is running successfully on PORT ${port}`))
}