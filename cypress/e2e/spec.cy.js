let code = ``
let server_address = `http://192.168.0.102:3001`

describe('mpc_node_mailer_server: General Responses from Servers', () => {
    it('Testing Server General Network IP and Port...', () => {
        cy.request(`GET`, server_address, {}).then((response) => {
            expect(response.status).to.eq(200)
            expect(response.body).to.be.a('string').and.not.be.empty;
        })
    })
})