import jwt from 'jsonwebtoken';
import bcrypjs from 'bcryptjs';

require('dotenv').config({path: 'variable.env'});
const saltLength = 10;

export const createToken = (user, userMode, expiresIn) => {
    const {id, email, firstName, lastName } = user;
    const mode = userMode.value;
    return jwt.sign({id, email, firstName, lastName, mode}, process.env.SECRET, {expiresIn});
  }

export const getUserFromToken = (token) => jwt.verify(token.replace('Bearer ', ''), process.env.SECRET);

export const hashPassword = async (password) => await bcrypjs.hash(password, await bcrypjs.genSalt(saltLength)); 

export const comparePasswords = (password, existingPassword) => bcrypjs.compare(password, existingPassword);