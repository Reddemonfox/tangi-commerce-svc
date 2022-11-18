import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from "../prisma.service";
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly prismaService;
    constructor(usersService: UsersService, jwtService: JwtService, prismaService: PrismaService);
    isValidEthAddress: (address: any) => any;
    isValidSignature: (address: any, signature: any, messageToSign: any) => boolean;
    validateUser(username: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: import(".prisma/client").users;
    }>;
    getMessage(user: any): Promise<{
        message: string;
    }>;
    register(user: any): Promise<import(".prisma/client").users>;
}
