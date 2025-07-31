const fs = require('fs')
const path = require('path')

describe('Testing if .env is working', () => {
    const envPath = path.resolve(__dirname, '../../.env')

    test('.env file should exist', () => {
        const fileExists = fs.existsSync(envPath)
        expect(fileExists).toBe(true)
    })

    beforeAll(() => {
        require('dotenv').config({ path: envPath })
    })

    test('dotenv should load ENCRYPTION_KEY', () => {
        expect(process.env.ENCRYPTION_KEY).toBeDefined()
    })

    test('dotenv should load ENCRYPTION_TYPE', () => {
        expect(process.env.ENCRYPTION_TYPE).toBeDefined()
    })

    test('dotenv should load ENCRYPTION_FORMAT', () => {
        expect(process.env.ENCRYPTION_FORMAT).toBeDefined()
    })

    test('dotenv should load ENCRYPTION_BASE', () => {
        expect(process.env.ENCRYPTION_BASE).toBeDefined()
    })

    test('dotenv should load ENCRYPTION_IV', () => {
        expect(process.env.ENCRYPTION_IV).toBeDefined()
    })

    test('dotenv should load ENCRYPTION_HASH', () => {
        expect(process.env.ENCRYPTION_HASH).toBeDefined()
    })

    test('dotenv should load NODE_MAILER_USER', () => {
        expect(process.env.NODE_MAILER_USER).toBeDefined()
    })

    test('dotenv should load NODE_MAILER_PASSWORD', () => {
        expect(process.env.NODE_MAILER_PASSWORD).toBeDefined()
    })

    test('dotenv should load SERVER_PORT', () => {
        expect(process.env.SERVER_PORT).toBeDefined()
    })

    test('dotenv should load DOCKER_CONTAINER_IMAGE_NAME', () => {
        expect(process.env.DOCKER_CONTAINER_IMAGE_NAME).toBeDefined()
    })

    test('dotenv should load DOCKER_CONTAINER_NAME', () => {
        expect(process.env.DOCKER_CONTAINER_NAME).toBeDefined()
    })
})

require('dotenv').config({ path: '../../.env' })

describe('All dependencies should be installed', () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

    const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    }

    Object.keys(dependencies).forEach((dep) => {
        test(`${dep} should be installed`, () => {
            expect(() => require(dep)).not.toThrow()
        })
    })
})

const { execSync } = require("child_process")

/*describe('Testing Axios installation', () => {
    test('should import axios without errors', () => {
        let axios
        expect(() => {
            axios = require('axios')
        }).not.toThrow()

        expect(axios).toBeDefined()
        expect(typeof axios.get).toBe('function')
    })
})
*/
/*const axios = require("axios")

describe(`Testing Docker Installation and Running`, () => {

    test("Check if Docker is installed on this machine", () => {

        try {
            const output = execSync("docker --version", { encoding: "utf-8" })
            expect(output).toMatch(/Docker version/)
        } catch (error) {
            throw new Error("Docker is not installed or not in PATH")
        }

    })

    test("Check if Docker is running at this moment", () => {

        try {
            const output = execSync("docker info", { encoding: "utf-8" })
            expect(output).toMatch(/Server Version/)
        } catch (error) {
            throw new Error("Docker is not running or not installed")
        }

    })

})
*/