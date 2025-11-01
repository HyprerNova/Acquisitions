import logger from '#config/logger.js';
import { signupSchema, signinSchema } from '#validations/auth.validation.js';
import {formatValidationError} from '#utils/format.js';
import { createUser, validateUser } from '#services/auth.service.js';
import { cookies } from '#utils/cookies.js';
import { jwttoken } from "#utils/jwt.js";
import bcrypt from 'bcrypt';

export const signup = async (req, res, next) => {
    try{
        const validationResult = signupSchema.safeParse(req.body);
        if(!validationResult.success){
            return res.status(400).json({
                error : 'Validation failed',
                details : formatValidationError(validationResult.error)
            });
        }
        const {name,email,password,role} = validationResult.data;

        const user = await createUser({name,email,password,role});

        const token = jwttoken.sign({id:user.id,email:user.email,role:user.role});

        cookies.set(res,'token',token);

        logger.info(`User registered successfully ${email}`);
        res.status(201).json({
            message:'User registered',
            user:{
                id: user.id, name:user.name, email:user.email, role:user.role
            }
        });
    }catch(error){
        logger.error('Signup error',error);
        if(error.message === 'User with this email already exists'){
            return res.status(409).json({error: 'Email already exisits'});
        }

        next(error);
    }
};


export const signin = async (req, res, next) => {
    try{
        const validationResult = signinSchema.safeParse(req.body);
        if(!validationResult.success){
            return res.status(400).json({
                error : 'Validation failed',
                details : formatValidationError(validationResult.error)
            });
        }
        const {email,password} = validationResult.data;

        const user = await validateUser({email,password});

        const token = jwttoken.sign({id:user.id,email:user.email,role:user.role});

        cookies.set(res,'token',token);

        logger.info(`User signed in successfully ${email}`);
        res.status(201).json({
            message:'User logged in',
            user:{
                id: user.id, name:user.name, email:user.email, role:user.role
            }
        });
    }catch(error){
        logger.error('Signup error',error);
        if(error.message === 'User does not exists or wrong password'){
            return res.status(409).json({error: 'Invalid email or password'});
        }
        next(error);
    }
};

export const signout = async (req, res, next) => {
    try{
        cookies.clear(res,'token');
        logger.info('User signed out successfully');
        res.status(200).json({message: 'User signed out'});
    }catch(error){
        logger.error('Signout error',error);
        next(error);
    }
};