import {ForbiddenException, Injectable} from '@nestjs/common';
import {UsersService} from '../users/users.service';
import {JwtService} from '@nestjs/jwt';
import {PrismaService} from "../prisma.service";

const Web3 = require('web3');
const {recoverPersonalSignature} = require("eth-sig-util");


const makeId = (length) => {
    let result = "";
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
};

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
    ) {
    }

    isValidEthAddress = (address) => Web3.utils.isAddress(address);

    isValidSignature = (address, signature, messageToSign) => {
        if (!address || typeof address !== "string" || !signature || !messageToSign) {
            return false;
        }

        const signingAddress = recoverPersonalSignature({
            data: messageToSign,
            sig: signature,
        });

        if (!signingAddress || typeof signingAddress !== "string") {
            return false;
        }

        return signingAddress.toLowerCase() === address.toLowerCase();
    };

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(username);
        if (user && user.password === pass) {
            const {password, ...result} = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        try {
            const {username: address, signature} = user;

            if (!this.isValidEthAddress(address) || !signature) {
                throw new ForbiddenException('Invalid Address');
            }


            const u = await this.prismaService.users.findFirstOrThrow({where: {username: address}});
            const payload = {
                "https://hasura.io/jwt/claims": {
                    "x-hasura-allowed-roles": [u.type  || "user"],
                    "x-hasura-default-role": u.type || "user",
                    "x-hasura-username": user.username,
                }
            };
            if (!u.messageToSign) {
                throw new ForbiddenException('Invalid Message');
            }
            const validSignature = this.isValidSignature(address, signature, u.messageToSign);

            if (!validSignature) {
                throw new ForbiddenException('Invalid Signature');
            }

            const shop = await this.prismaService.shops.findFirst({where: {users: {username: user.username}}})
            if (!u) {
                throw new ForbiddenException();
            }
            if (shop) {
                payload["https://hasura.io/jwt/claims"]['x-hasura-shop-id'] = shop.id;
                payload["https://hasura.io/jwt/claims"]['x-hasura-user-id'] = u.id;
            }
            await this.prismaService.users.update({where: {username: user.username}, data: {messageToSign: ''}});


            return {
                access_token: this.jwtService.sign(payload),
                user: u
            };
        } catch (err) {
            console.log("Error:", err);
            throw new ForbiddenException(err.toString())
        }
    }


    async getMessage(user: any) {
        const address = user.username;
        if (!this.isValidEthAddress(address)) {
            throw new ForbiddenException('Invalid Address');
        }

        const randomString = makeId(20);
        let messageToSign = `Wallet address: ${address} Nonce: ${randomString}`;
        let u = null;
        try {
            u = await this.prismaService.users.findFirstOrThrow({where: user});
            if (!u.messageToSign) {
                await this.prismaService.users.update({where: user, data: {messageToSign}});
            } else {
                messageToSign = u.messageToSign
            }
        } catch (e) {
            u = await this.prismaService.users.create({data: {...user, messageToSign}});
        }

        return {
            message: messageToSign,
        };
    }


    async register(user: any) {
        return this.prismaService.users.create({data: user});
    }
}

