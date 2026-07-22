// import bcrypt from "bcrypt";
// import {prisma} from "../../config/database.js";
// import {AppError} from "../../middlewares/errorHandler.js";

// const SALT_ROUNDS = 12;
// //validate invitation
// export const validateInvitation = async ({token}) => {
//     const client = await prisma.client.findUnique({
//         where: {
//             magicToken: token,
//         },
//     });


//     if(!client){
//         throw new AppError(
//             409,
//             "TOEKN_ALREADY_USED",
//             "This invitation link has already been used."
//         );
//     }

//     if(client.tokenExpiredAt < new Date()) {
//         throw new AppError(
//             410,
//             "TOEKN_EXPIRED",
//             "Invitation link has expired"
//         );
//     }

//     return {
//         firstName: client.firstName,
//         lastName: client.lastName,
//         email: client.email,
//         accountStatus: client.accountStatus,
//     };

// };


// //create Password
// export const createPassword = async ({token,password}) => {
//     const client = await prisma.client.findUnique({
//         where:{
//             magicToken: token,

//         },
//     });

//     if(!client) {
//         throw new AppError(
//             404,
//             "INVALID_INVITATION",
//             "Invitation link is invalid."
//         );
//     }

//     if(client.isTokenUsed){
//         throw new AppError(
//             404,
//             "TOKEN_ALREADY_USED",
//             "Invitation link has already been used."
//         )
//     }

//     if(client.tokenExpiredAt < new Date()) {
//         throw new AppError(
//             410,
//             "TOKEN_EXPIRED",
//             "Invitation link has expired."
//     );
       
//     }

//     if(client.accountStatus !== "INVITED"){
//         throw new AppError(
//             409,
//             "ACCOUNT_ALREADY_ACTIVE",
//             "Client account has already been activated."
//         );
//     }


//     const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
//     await prisma.client.update({
//         where: {
//             id: client.id,
//         },

//         data: {
//             passwordHash,
//             accountStatus: "ACTIVE",
//             isActive: true,
//             isTokenUsed: true,
//             tokenExpiredAt: null,
//         },
//     });

//     return {
//         message: "password created successfully."
//     };

// };






