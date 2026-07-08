import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.js";

describe("Auth API", () => {

    it("should reject empty registration", async () => {

        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({});

        expect(response.status).toBe(400);

    });

    it("should reject invalid email", async () => {

        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({
                agencyName: "Sky",
                subdomain: "sky",
                email: "wrong-email",
                password: "Password123!"
            });

        expect(response.status).toBe(400);

    });
    it("should agency register successful", async () => {

        const response = await request(app)
            .post("/api/v1/auth/register")
            .send({
                agencyName: "Sky",
                subdomain: "sky",
                email: "send1@gmail.com",
                password: "Password123!"
            });

        expect(response.status).toBe(201);

    });


     it("should reject login with wrong password", async () => {
        // 1. First register a baseline user seed manually
        await request(app)
            .post("/api/v1/auth/register")
            .send({
                agencyName: "Login Test Agency",
                subdomain: "logintest",
                email: "login@test.com",
                password: "CorrectPassword123!"
            });

        // 2. Attempt to login with an invalid password string match
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                email: "login@test.com",
                password: "WrongPassword!!!"
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("should login user successfully and return a signed JWT token", async () => {
        // 1. Seed user registration instance
        await request(app)
            .post("/api/v1/auth/register")
            .send({
                agencyName: "Auth Travel Co",
                subdomain: "authtravel",
                email: "admin@authtravel.com",
                password: "SecurePassword123!"
            });

        // 2. Execute target authentication action
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                email: "admin@authtravel.com",
                password: "SecurePassword123!"
            });

        // 3. Verify security assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("token");
        expect(response.body.data.profile.email).toBe("admin@authtravel.com");
    });
});