import logger from '#config/logger.js';
import { 
    getAllUsers, 
    getUserById, 
    updateUser, 
    updateUserPassword, 
    deleteUser 
} from '#services/users.services.js';
import { hashPassword } from '#services/auth.service.js';

export const fetchAllUsers = async (req, res, next) => {
    try{
        logger.info('Getting all users');
        const users = await getAllUsers();
        res.status(200).json({
            message:'Users fetched successfully',
            users:users,
            total:users.length,
        });
    }catch(error){
        logger.error('Error getting all users',error);
        next(error);
    }
}

export const fetchUserById = async (req, res, next) => {
    try{
        const { id } = req.params;
        logger.info(`Getting user with id: ${id}`);
        
        const user = await getUserById(parseInt(id));
        
        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        res.status(200).json({
            message: 'User fetched successfully',
            user: user,
        });
    }catch(error){
        logger.error('Error getting user by id',error);
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
}

export const updateUserById = async (req, res, next) => {
    try{
        const { id } = req.params;
        const { name, email, role, password } = req.body;
        
        logger.info(`Updating user with id: ${id}`);
        
        // Prepare update data (exclude password, handle separately)
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        
        // Update user fields (excluding password)
        const updatedUser = await updateUser(parseInt(id), updateData);
        
        // If password is provided, update it separately with hashing
        if (password) {
            const hashedPassword = await hashPassword(password);
            const userWithNewPassword = await updateUserPassword(parseInt(id), hashedPassword);
            // Merge the results
            Object.assign(updatedUser, {
                updated_at: userWithNewPassword.updated_at
            });
        }
        
        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser,
        });
    }catch(error){
        logger.error('Error updating user',error);
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Email already exists') {
            return res.status(409).json({ error: error.message });
        }
        next(error);
    }
}

export const deleteUserById = async (req, res, next) => {
    try{
        const { id } = req.params;
        logger.info(`Deleting user with id: ${id}`);
        
        const deletedUser = await deleteUser(parseInt(id));
        
        res.status(200).json({
            message: 'User deleted successfully',
            user: deletedUser,
        });
    }catch(error){
        logger.error('Error deleting user',error);
        if (error.message === 'User not found') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
}