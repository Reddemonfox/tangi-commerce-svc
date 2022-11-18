import {Body, Controller, Get, Post, Request, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {AuthService} from './auth/auth.service';
import {JwtAuthGuard} from './auth/guards/jwt-auth.guard';
import {LocalAuthGuard} from './auth/guards/local-auth.guard';
import {RegisterDto} from "./users/register.dto";
import {LoginDto} from "./users/login.dto";
import {S3Service} from "./s3.service";
import {FileInterceptor} from "@nestjs/platform-express";

@Controller()
export class AppController {
    constructor(private readonly authService: AuthService, private readonly s3Service: S3Service) {
    }

    @Post('auth/login')
    async login(@Body() body: LoginDto) {
        return this.authService.login(body);
    }

    @Get('healthcheck')
    async healthCheck() {
        return {success: true};
    }

    @Post('auth/get-message')
    async getMessage(@Body() body: LoginDto) {
        return this.authService.getMessage(body);
    }

    @Post('auth/register')
    async register(@Body() body: RegisterDto) {
        return this.authService.register(body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }

    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    @Post('image/upload')
    async imageUpload(@UploadedFile() file: Express.Multer.File) {
        return this.s3Service.uploadFile(file);
    }
}

