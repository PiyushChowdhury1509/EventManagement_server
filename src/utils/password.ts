import bcrypt from "bcrypt"

export const hashPassword = async (password: string): Promise<string> => {
   const hashedPassword = await bcrypt.hash(password,5);
   return hashedPassword;
}

export const comparePassword = async (userPassword: string, password: string): Promise<boolean> =>{
    return await bcrypt.compare(userPassword,password);
}