import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

export const getAllUsers = async () => {
    try{
        // Select all users, excluding password for security
        const allUsers = await db.select().from(users);
        
        // Remove password from results
        return allUsers.map(({ password, ...user }) => user);
    }catch(error){
        logger.error('Error getting all users',error);
        throw error;
    }
}

export const getUserById = async (id) => {
    try{
        const [user] = await db.select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Remove password from result
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }catch(error){
        logger.error('Error getting user by id',error);
        throw error;
    }
}

export const updateUser = async (id, updateData) => {
    try{
        // Check if user exists
        const [existingUser] = await db.select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        
        if (!existingUser) {
            throw new Error('User not found');
        }
        
        // If email is being updated, check if it's already taken by another user
        if (updateData.email && updateData.email !== existingUser.email) {
            const [userWithEmail] = await db.select()
                .from(users)
                .where(eq(users.email, updateData.email))
                .limit(1);
            
            if (userWithEmail) {
                throw new Error('Email already exists');
            }
        }
        
        // Prepare update data (exclude password if not provided, or hash it if provided)
        const updateFields = {
            ...updateData,
            updated_at: new Date(),
        };
        
        const { password, ...fieldsToUpdate } = updateFields;
        
        // Update user
        const [updatedUser] = await db.update(users)
            .set(fieldsToUpdate)
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                created_at: users.created_at,
                updated_at: users.updated_at,
            });
        
        return updatedUser;
    }catch(error){
        logger.error('Error updating user',error);
        throw error;
    }
}

export const updateUserPassword = async (id, hashedPassword) => {
    try{
        const [updatedUser] = await db.update(users)
            .set({ 
                password: hashedPassword,
                updated_at: new Date(),
            })
            .where(eq(users.id, id))
            .returning({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                created_at: users.created_at,
                updated_at: users.updated_at,
            });
        
        if (!updatedUser) {
            throw new Error('User not found');
        }
        
        return updatedUser;
    }catch(error){
        logger.error('Error updating user password',error);
        throw error;
    }
}

export const deleteUser = async (id) => {
    try{
        // Check if user exists
        const [user] = await db.select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Delete user
        await db.delete(users)
            .where(eq(users.id, id));
        
        // Return user info (without password) for confirmation
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }catch(error){
        logger.error('Error deleting user',error);
        throw error;
    }
}