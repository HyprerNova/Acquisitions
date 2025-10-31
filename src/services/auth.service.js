import logger from "#config/logger.js"
import bcrypt from 'bcrypt';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { id } from "zod/v4/locales";
import { eq } from 'drizzle-orm';
export const hashPassword = async (password) =>{
    try{
        return await bcrypt.hash(password,10);
    }catch(e){
        logger.error('Error hashing password',e);
        throw new Error('Error hashing password');
    }
};

export const createUser = async({name,email,password,role='user'}) =>{
    try{
        const existingUser = await db.select().from(users).where(eq(users.email,email)).limit(1);

        if(existingUser.length > 0) throw new Error('User already exists');

        const passwordHash = await hashPassword(password);

        const [newuser] = await db.
        insert(users).values({name,email,password:passwordHash,role}).
        returning({id:users.id,name:users.name,email:users.email,role:users.role,created_at:users.created_at});

        logger.info('New user created successfully');

        return newuser

    }catch(e){
        logger.error('Error creating a user',e);
        throw e;
    }
}