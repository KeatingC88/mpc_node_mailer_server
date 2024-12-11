let code = ``

describe('mpc_node_mailer_server: General Response', () => {
    it('Testing Server General Response and Port...', () => {
        cy.request(`GET`, `http://localhost:3001/`, {}).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.be.a('string').and.not.be.empty;
        })
    })
})

describe('mpc_node_mailer_server: Verification Code Response', () => {
    it('Testing Server a Verification Code...', () => {
        cy.request(`POST`, `http://localhost:3001/api/Send/Confirmation/Email/en-US/local@email.com`, {}).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.have.property(`code`)
            expect(response.body.code).to.be.a('string').and.not.be.empty;
            code = response.body.code
        })
    })
})

describe('mpc_node_mailer_server: Confirmation Code Responses', () => {

    it('Testing Successful Response...', () => {
        cy.request(`GET`, `http://localhost:3001/api/Recieved/Confirmation/Email/local@email.com?code=${code}`).then((response) => {
            expect(response.status).to.eq(200)
            console.log(response)
        })
    })
    
})