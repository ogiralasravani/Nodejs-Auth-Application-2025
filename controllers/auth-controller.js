const User = require('../models/User')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');


// register controller

const registerUser = async (req, res) => {
    try {
        // extract user information from our request body
        const { username, email, password, role } = req.body;

        //check if the user is alredy exists in our database
        const checkExistingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        if (checkExistingUser) {
            res.status(400).json({
                success: false,
                message: 'user is alredy exists with the same username or same email'
            })
        }
        //hash user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        //create a new user and store in your database
        const newlyCreatedUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'user',
        })
        await newlyCreatedUser.save();
        if (newlyCreatedUser) {
            res.status(201).json({
                success: true,
                message: 'register sucessfully!',
            })
        } else {
            res.status(400).json({
                success: false,
                message: 'unable to register user! please try again'
            })
        }
    } catch (e) {
        console.log(e);

        res.status(500).json({
            success: false,
            message: 'some error occured! Please try again.'
        })


    }
}

//login controller

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        //find if the user is exists in database or not

        const user = await User.findOne({ username });

        if (!user) {
            res.status(400).json({
                success: false,
                message: 'user does not exit'
            })
        }
        // if the password is correct or not
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            res.status(400).json({
                success: false,
                message: 'invalid credentials'
            })

        }

        //create user token
        const accessToken = await jwt.sign({
            userId: user._id,
            username: user.username,
            role: user.role,

        }, process.env.JWT_SECRET_KEY, {
            expiresIn: '30m'
        })

        res.status(200).json({
            success: true,
            message: 'logged in successful',
            accessToken

        })

    } catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: 'some error occured! Please try again.'
        })


    }
}

//change password

const changePassword=async(req,res)=>{
    try {
        const userId=req.userInfo.userId;

        //extract old and new password
        const {oldPassword, newPassword}=req.body;

        //find the current logged in user
        const user=await User.findById(userId)

        if(!user){
            res.status(400).json({
                success:false,
                message:'user not found'
            })
        }

        //check if the old password is correct
        const isPasswordMatch=await bcrypt.compare(oldPassword, user.password);

        if(!isPasswordMatch){
            res.status(400).json({
                success:false,
                message:'old password is not correct! please try again.'
            })
        }

        //hash the new password

        const salt=await bcrypt.genSalt(10);
        const newashedPassward=await bcrypt.hash(newPassword, salt);

        //update user password
        user.password=newashedPassward
        await user.save();

        res.status(200).json({
            success:true,
            message:'password changed successfully!'
        })




        
    } catch (e) {
        console.log(e);
         res.status(500).json({
            success: false,
            message: 'some error occured! Please try again.'
        })

        
        
    }
}



module.exports = { registerUser, loginUser, changePassword };