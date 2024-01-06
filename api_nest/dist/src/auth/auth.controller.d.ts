/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose" />
/// <reference types="mongoose/types/inferschematype" />
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { GetUserDto } from './dto/get-user.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    findOne(getUserDto: GetUserDto): Promise<{
        token: string;
        user: {
            id: any;
            name: string;
            email: string;
        };
        teams: (import("mongoose").Document<unknown, {}, import("../team/entities/team.entity").Team> & import("../team/entities/team.entity").Team & {
            _id: import("mongoose").Types.ObjectId;
        })[];
    }>;
    create(createAuthDto: CreateAuthDto): Promise<{
        payload: string;
    }>;
}