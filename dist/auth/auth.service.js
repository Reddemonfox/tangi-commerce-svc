"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma.service");
const Web3 = require('web3');
const { recoverPersonalSignature } = require("eth-sig-util");
const makeId = (length) => {
    let result = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
let AuthService = class AuthService {
    constructor(usersService, jwtService, prismaService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.prismaService = prismaService;
        this.isValidEthAddress = (address) => Web3.utils.isAddress(address);
        this.isValidSignature = (address, signature, messageToSign) => {
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
    }
    async validateUser(username, pass) {
        const user = await this.usersService.findOne(username);
        if (user && user.password === pass) {
            const { password } = user, result = __rest(user, ["password"]);
            return result;
        }
        return null;
    }
    async login(user) {
        try {
            const { username: address, signature } = user;
            if (!this.isValidEthAddress(address) || !signature) {
                throw new common_1.ForbiddenException('Invalid Address');
            }
            const u = await this.prismaService.users.findFirstOrThrow({ where: { username: address } });
            const payload = {
                "https://hasura.io/jwt/claims": {
                    "x-hasura-allowed-roles": [u.type || "user"],
                    "x-hasura-default-role": u.type || "user",
                    "x-hasura-username": user.username,
                }
            };
            if (!u.messageToSign) {
                throw new common_1.ForbiddenException('Invalid Message');
            }
            const validSignature = this.isValidSignature(address, signature, u.messageToSign);
            if (!validSignature) {
                throw new common_1.ForbiddenException('Invalid Signature');
            }
            const shop = await this.prismaService.shops.findFirst({ where: { users: { username: user.username } } });
            if (!u) {
                throw new common_1.ForbiddenException();
            }
            if (shop) {
                payload["https://hasura.io/jwt/claims"]['x-hasura-shop-id'] = shop.id;
                payload["https://hasura.io/jwt/claims"]['x-hasura-user-id'] = u.id;
            }
            await this.prismaService.users.update({ where: { username: user.username }, data: { messageToSign: '' } });
            return {
                access_token: this.jwtService.sign(payload),
                user: u
            };
        }
        catch (err) {
            console.log("Error:", err);
            throw new common_1.ForbiddenException(err.toString());
        }
    }
    async getMessage(user) {
        const address = user.username;
        if (!this.isValidEthAddress(address)) {
            throw new common_1.ForbiddenException('Invalid Address');
        }
        const randomString = makeId(20);
        let messageToSign = `Wallet address: ${address} Nonce: ${randomString}`;
        let u = null;
        try {
            u = await this.prismaService.users.findFirstOrThrow({ where: user });
            if (!u.messageToSign) {
                await this.prismaService.users.update({ where: user, data: { messageToSign } });
            }
            else {
                messageToSign = u.messageToSign;
            }
        }
        catch (e) {
            u = await this.prismaService.users.create({ data: Object.assign(Object.assign({}, user), { messageToSign }) });
        }
        return {
            message: messageToSign,
        };
    }
    async register(user) {
        return this.prismaService.users.create({ data: user });
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map