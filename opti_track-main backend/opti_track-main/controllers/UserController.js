const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email");
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {

    if (req.body.password) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'firstname','lastname','phoneNumber', 'email');

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.createUser = catchAsync(async (req, res, next) => {
    const password = crypto.randomBytes(5).toString('hex'); // 5 bytes will give a 10-character hexadecimal string

    const newUser = await User.create({
        firstname: req.body.firstname,
        phoneNumber: req.body.phoneNumber,
        lastname: req.body.lastname,
        email: req.body.email,
        password: password,
        role: req.body.role

    });

    createSendToken(newUser, 201, res);
    const message =`u have been added as ${newUser.role},this is your password: ${password}, you can change it later`
    try {
        await sendEmail({
            email: newUser.email,
            subject: `Welcome to OptiTrack team`,
            message
        });
    }catch (err) {
AppError('There was an error sending the email. Try again later!',500)
    }
});
// exports.createUser = (req, res) => {
//     res.status(500).json({
//         status: 'error',
//         message: 'This route is not defined! Please use /signup instead'
//     });
// };

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
