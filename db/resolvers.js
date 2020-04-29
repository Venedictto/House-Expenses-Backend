const Expense = require('../models/Expense');
const User = require('../models/User');
const bcrypjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
var ObjectId = require('mongoose').Types.ObjectId;
require('dotenv').config({path: 'variable.env'});

const createToken = (user, secret, expiresIn) => {
    const {id, email, firstName, lastName } = user;
    return jwt.sign({id, email, firstName, lastName},secret, {expiresIn});
}

// Resolvers
const resolvers = {
    Query: {
        getExpenses: async (_, {input}, ctx) => {
            const {month, year} = input;
            const userId = new ObjectId(ctx.user.id);
            try {               
                const expenses = await Expense.find({"userId" : userId, "currentMonth" : month, "currentYear": year });
                return expenses;
            } catch (err) {
                console.log(err);
                return (err);
            }
        },
        getUser: async (_, {token}) => {
            const userId = await jwt.verify(token, process.env.SECRET);
            return userId
        }
    },
    Mutation: {
        addRangeExpenses: async (_, {input}, ctx) => {
            const {monthAmount, name, amount, startMonth, startYear, type} = input;
            const { user } = ctx;
            try {
                const expenses = [];
                for(let i = 0; i < monthAmount; i++ ){
                    const expense = new Expense(
                        {
                            name: name,
                            amount: amount,
                            type: type,
                            startMonth: startMonth,
                            startYear: startYear,
                            currentMonth: ((startMonth + i) % 11),
                            currentYear: (startMonth + i > 11) ? startYear+1 : startYear,
                            userId: new ObjectId(user.id) 
                        }
                        );
                    expense.save();
                    expenses.push(expense);
                }
                // @ts-ignore
                return expenses.find(expense => expense.currentMonth === startMonth);
            } catch (err) {
                console.log(err);
                return (err);
            }
        },
        deleteExpense: async (_, {input}, ctx) => {
            const {expenseId, deleteType, name} = input;
            const userId = new ObjectId(ctx.user.id);
            try {
                if(ctx.user === undefined) throw new Error('User is not found.');
                let query = {userId: userId};
                if(deleteType === 'One') query = {...query, _id: ObjectId(expenseId)}
                if(deleteType === 'allNonPayments') query = {...query, name: name, paid: false}
                if(deleteType === 'All') query = {...query, name: name}
                const data = await Expense.remove(query);
                return true;                
            } catch (err) {
                console.log(err);
                return (err);
            }
        },
        updateExpense: async (_, {input}, ctx) => {
            const {expenseId, amount, paid, type} = input;
            try {
                if(amount === undefined && type === undefined && paid === undefined) throw new Error('Invalid parameters.')
                let expense = await Expense.findById(new ObjectId(expenseId));
                if(!expense) {throw new Error('Expense not found')}
                let query = { $set: {  } };
                if(amount !== undefined) query.$set = { ...query.$set, amount: amount, type: type };
                if(paid !== undefined) query.$set = {...query.$set,paid: paid };
                expense = await Expense.findOneAndUpdate(
                    {_id: new ObjectId(expenseId)}, query, {new: true});
                return expense;

            } catch (err) {
                console.log(err);
                return (err);
            }

        },
        addUser: async (_, {input}, ctx) => {
            const {email, password} = input;
            try { 
                const existingUser = await User.findOne({email});
                if(existingUser) {throw new Error('Existing User')}
                const salt = await bcrypjs.genSalt(10);
                input.password = await bcrypjs.hash(password, salt); 
                          
                const user = new User(input);
                user.save();
                return user;
            } catch (err) {
                console.log(err);
                return (err);
            }
        },
        userAuthorization: async (_, {input}, ctx) => {
            const {email, password} = input;

            const existingUser = await User.findOne({email});
            if(!existingUser) {throw new Error('User not found')};
            // @ts-ignore
            const correctPassword = await bcrypjs.compare(password, existingUser.password);
            if(!correctPassword){
                throw new Error('Incorrect password');
            }

            return {
                token: createToken(existingUser, process.env.SECRET, '24h')
            }
        }
    }

}

module.exports = resolvers;
