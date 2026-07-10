// import request from "supertest";
// import { beforeAll, afterAll, describe, expect, it } from "vitest";

// import app from "../../app.js";
// import {prisma} from "../../config/database.js";

// let adminToken;
// let deskAgencyId;

// beforeAll(async () => {
//     await request(app)
//         .post("/api/v1/auth/register")
//         .send({
//             agencyName: "sky Travels",
//             subdomain: "skytravels",
//             email: "admin@skytravels.com",
//             password: "Password123!",
//         });

//     const login = await request(app)
//         .post("/api/v1/auth/login")
//         .send({
//             email: "admin@skytravels.com",
//             password: "Password123!",
//         });

//     adminToken = login.body.data.token;  
// });


// // staff test
// describe("POST /staff", () => {
//     it("should create a desk agent", async () => {
//         const response = await request(app)
//             .post("/api/v1/staff")
//             .set("Authorization", `Bearer ${adminToken}`)
//             .send({
//                 email: "agent1@test.com",
//                 password: "Password123!",
//                 role: "DESK_AGENT",
//             });

//         expect(response.status).toBe(201);
//         expect(response.body.success).toBe(true);
//         deskAgencyId = response.body.data.id;
//     });

//     it("should reject duplicate email", async () => {

//     const response = await request(app)
//         .post("/api/v1/staff")
//         .set("Authorization", `Bearer ${adminToken}`)
//         .send({
//         email: "agent1@test.com",
//         password: "Password123!",
//         role: "DESK_AGENT",
//         });

//     expect(response.status).toBe(409);
//     });

//     it("should require authentication", async () => {

//   const response = await request(app)
//     .post("/api/v1/staff")
//     .send({
//       email: "agent@test.com",
//       password: "Password123!",
//       role: "DESK_AGENT",
//     });

//   expect(response.status).toBe(401);
// });


// });


// describe("GET /staff", () => {

//   it("should return all staff", async () => {

//     const response = await request(app)
//       .get("/api/v1/staff")
//       .set("Authorization", `Bearer ${adminToken}`);

//     expect(response.status).toBe(200);

//     expect(Array.isArray(response.body.data)).toBe(true);

//   });

// });


// // describe("PATCH /staff/:id/status", () => {

// //   it("should deactivate a staff account", async () => {

// //     const response = await request(app)
// //       .patch(`/api/v1/staff/${deskAgentId}/status`)
// //       .set("Authorization", `Bearer ${adminToken}`)
// //       .send({
// //         isActive: false,
// //       });

// //     expect(response.status).toBe(200);

// //     expect(response.body.data.isActive).toBe(false);

// //   });

// // });




import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest"; // 🟩 Changed beforeAll to beforeEach

import app from "../../app.js";
import {prisma} from "../../config/database.js";

let adminToken;
let deskAgentId; // 🟩 Standardized tracking variable name

// 🟩 CRITICAL FIX: Run registration before EACH test item to beat the setup.js cleanup loop
beforeEach(async () => {
    // 1. Seed tenant admin profile
    await request(app)
        .post("/api/v1/auth/register")
        .send({
            agencyName: "sky Travels",
            subdomain: "skytravels",
            email: "admin@skytravels.com",
            password: "Password123!",
        });

    // 2. Extract valid token credentials
    const login = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: "admin@skytravels.com",
            password: "Password123!",
        });

    adminToken = login.body.data.token;  
});

describe("POST /staff", () => {
    it("should create a desk agent", async () => {
        const response = await request(app)
            .post("/api/v1/staff")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                email: "agent1@test.com",
                password: "Password123!",
                role: "DESK_AGENT",
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        
        // 🟩 FIXED: Assigned response ID to the correct matching global variable name
        deskAgentId = response.body.data.id; 
    });

    it("should reject duplicate email", async () => {
        // Seed first agent manually inside this local sandbox test context
        await request(app)
            .post("/api/v1/staff")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                email: "agent1@test.com",
                password: "Password123!",
                role: "DESK_AGENT",
            });

        const response = await request(app)
            .post("/api/v1/staff")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                email: "agent1@test.com",
                password: "Password123!",
                role: "DESK_AGENT",
            });

        expect(response.status).toBe(409);
    });

    it("should require authentication", async () => {
        const response = await request(app)
            .post("/api/v1/staff")
            .send({
                email: "agent@test.com",
                password: "Password123!",
                role: "DESK_AGENT",
            });

        expect(response.status).toBe(401);
    });
});

describe("GET /staff", () => {
    it("should return all staff", async () => {
        const response = await request(app)
            .get("/api/v1/staff")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });
});

// describe("PATCH /staff/:id/status", () => {
//     it("should deactivate a staff account", async () => {
//         // 🟩 CRITICAL FIX: Since the database was wiped before this test, 
//         // we must create a staff record here first to get a valid ID to deactivate!
//         const agentSetup = await request(app)
//             .post("/api/v1/staff")
//             .set("Authorization", `Bearer ${adminToken}`)
//             .send({
//                 email: "deactivate-me@test.com",
//                 password: "Password123!",
//                 role: "DESK_AGENT",
//             });

//         const dynamicAgentId = agentSetup.body.data.id;

//         const response = await request(app)
//             .patch(`/api/v1/staff/${dynamicAgentId}/status`) // 🟩 Uses the fresh dynamic ID
//             .set("Authorization", `Bearer ${adminToken}`)
//             .send({
//                 isActive: false,
//             });

//         expect(response.status).toBe(200);
//         expect(response.body.data.isActive).toBe(false);
//     });
// });



describe("PATCH /staff/:id/status", () => {
    it("should deactivate a staff account", async () => {
        // 🟩 CRITICAL FIX: Since the database was wiped before this test, 
        // we must create a staff record here first to get a valid ID to deactivate!
        const agentSetup = await request(app)
            .post("/api/v1/staff")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                email: "deactivate-me@test.com",
                password: "Password123!",
                role: "DESK_AGENT",
            });

        const deskAgencyId = agentSetup.body.data.id;

        const response = await request(app)
            .patch(`/api/v1/staff/${deskAgencyId}/status`) // 🟩 Uses the fresh dynamic ID
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                isActive: false,
            });

        expect(response.status).toBe(200);
        expect(response.body.data.isActive).toBe(false);
    });
});