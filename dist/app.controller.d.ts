/// <reference types="multer" />
import { AuthService } from './auth/auth.service';
import { RegisterDto } from "./users/register.dto";
import { LoginDto } from "./users/login.dto";
import { S3Service } from "./s3.service";
export declare class AppController {
    private readonly authService;
    private readonly s3Service;
    constructor(authService: AuthService, s3Service: S3Service);
    login(body: LoginDto): Promise<{
        access_token: string;
        user: import(".prisma/client").users;
    }>;
    getMessage(body: LoginDto): Promise<{
        message: string;
    }>;
    register(body: RegisterDto): Promise<import(".prisma/client").users>;
    getProfile(req: any): any;
    imageUpload(file: Express.Multer.File): Promise<{
        location: string;
    }>;
}
