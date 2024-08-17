const request = require('supertest')
const expect = require('chai').expect;

describe("Login user fail when missing password or login key", () =>{
    const baseUrl = "http://127.0.0.1:5000";

    const data = {
        login: "4657U"
    }
    it("Must receive 400 status error", (done) => {
        request(baseUrl)
        .post("/api/v1/user/login")
        .send(data)
        .set("Accept", "application/json")
        .set("Content-Type", "application/json")
        .end((err, res) =>{
            expect(res.statusCode).to.equal(400);
            expect(res.body.error).not.to.equal("");
            expect(res.body.message).not.to.equal("");

            if(err){
                throw err
            }
            done()
        })
    });
})

describe("Login user Successfull", () =>{
    const baseUrl = "http://127.0.0.1:5000";

    const data = {
        login: "4657U",
        password: "26434UESD"
    }


    it("Must receive 200 success status code ", (done) => {
        request(baseUrl)
        .post("/api/v1/user/login")
        .send(data)
        .set("Accept", "application/json")
        .set("Content-Type", "application/json")
        .end((err, res) =>{
            expect(res.statusCode).to.equal(200);
            expect(res.body.error).to.equal(undefined);
            expect(res.body.data).not.to.equal(null);
            expect(res.body.data.token).to.be.a('string');
            expect(res.body.data.expire).to.equal(3600);
            if(err){
                throw err
            }
            done()
        })
    })
})