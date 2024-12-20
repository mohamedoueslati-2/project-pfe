const tech = require('../models/techModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const axios = require("axios");
const sendEmail = require("../utils/email");
const AppError = require("../utils/appError");
const crypto = require('crypto');

exports.getAlltech = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(tech.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const techs = await features.query;

    // SEND RESPONSE
    res.status(200).json(

        techs

    );
    next()
});
exports.getAvailableTech = catchAsync(async (req, res, next) => {

    try {
        const operationDays = req.body.operationDays;
if (!operationDays) {

    return next('Please provide operation days in the request body.', 400);
}

        const availableTechnicians = await tech.find({
            disponibility: true, // Technician is available
            Status: { $not: { $elemMatch: { date: { $in: operationDays } } } }
        });

        res.json(availableTechnicians); // Return array of technician objects as JSON response
    } catch (error) {
        console.error("Error fetching available technicians:", error);
        res.status(500).json({ error: "Failed to fetch available technicians from the database." });
    }
});
exports.getAvailableTech_update = catchAsync(async (req, res, next) => {

    try {
        const {operationDays,operation_id} = req.body;
        console.log("operationDays",operationDays)// Get operation days array from request body
if (!operationDays) {

    return next('Please provide operation days in the request body.', 400);
}
        // Query the database for technicians who are available
        let availableTechnicians = await tech.find({
            disponibility: true, // Technician is available
            $or: [
                { Status: { $not: { $elemMatch: { date: { $in: operationDays } } } } },
                { Status: { $elemMatch: { date: { $in: operationDays }, operationId: operation_id } } }
            ]
        });
console.log(availableTechnicians)
        // let oldTechnicians = await tech.find({
        //     _id: { $in: techs_id }});
        // availableTechnicians = availableTechnicians.concat(oldTechnicians);
        res.json(availableTechnicians); // Return array of technician objects as JSON response
    } catch (error) {
        console.error("Error fetching available technicians:", error);
        res.status(500).json({ error: "Failed to fetch available technicians from the database." });
    }
});


exports.gettech = catchAsync(async (req, res, next) => {
    const Tech = await tech.findById(req.params.id).populate({
        path:'currentOperation',
        select:'name accessCode startTime endTime Description site responsable'
    });
    // const Tech = await tech.findOne({ Email: req.query.Email }).populate({
    //     path:'currentOperation',
    //     select:'name accessCode startTime endTime Description site responsable'
    // });
    if (!Tech) {
        return next('No technician found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            Tech
        }
    });
});
exports.gettechmobile = catchAsync(async (req, res, next) => {
    // const Tech = await tech.findById(req.params.id).populate({
    //     path:'currentOperation',
    //     select:'name accessCode startTime endTime Description site responsable'
    // });
    const Tech = await tech.findOne({ Email: req.query.Email }).populate({
        path:'currentOperation',
        select:'name accessCode startTime endTime Description site responsable',
        populate: {
            path: 'site',
            select: 'name address longitude latitude state geofence city ' // replace 'siteField1', 'siteField2', etc. with the actual field names you want to select in the site document
        }
    }).populate({
        path:'pastOperations',
        select:'name startTime endTime Description site ',
        populate: {
            path: 'site',
            select: 'name address longitude latitude state geofence city ' // replace 'siteField1', 'siteField2', etc. with the actual field names you want to select in the site document
        }
    });
    if (!Tech) {
        return next('No technician found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            Tech
        }
    });
});
exports.gettechmobile_archive = catchAsync(async (req, res, next) => {
    // const Tech = await tech.findById(req.params.id).populate({
    //     path:'currentOperation',
    //     select:'name accessCode startTime endTime Description site responsable'
    // });
    const Tech = await tech.findOne({ Email: req.query.Email }).populate({
        path:'pastOperations',
        select:'name startTime endTime Description site '
    });
    if (!Tech) {
        return next('No technician found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            Tech
        }
    });
});

exports.createtech= catchAsync(async (req, res, next) => {
    try {
        const password = crypto.randomBytes(5).toString('hex'); // 5 bytes will give a 10-character hexadecimal string

        // Add the password to the request body
        req.body.password = password;

        const newTech = await tech.create(req.body);

    const { Fullname,_id,Email } = newTech;
    // Define fence creation payload
    const techPayload = {
        name: Fullname,
        uniqueId:_id,
        category: "technician",
        "attributes": {
            "email": Email
        }
    };
    const credentials = Buffer.from('mohamedouesalti080@gmail.com:RZedi!Z9MpqnF@K').toString('base64');



        const response = await axios.post("https://demo4.traccar.org/api/devices",techPayload,{

            headers: {
                // Include the encoded credentials in the Authorization header
                Authorization: `Basic ${credentials}`
            }
        });

        newTech.device = response.data.id;
        await newTech.save();
        console.log('tech created successfully:', response.data);
        const message = `Welcome to OptiTrack, ${newTech.Fullname}! Your account has been created successfully. Your password is ${password}. Please change your password after logging in.`;

        try {
            await sendEmail({
                email: newTech.Email,
                subject: 'Your Password for OptiTrack mobile Account',
                message
            });

            res.status(200).json({
                status: 'success',
                message: 'Token sent to email!'
            });
        } catch (err) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return next(
                new AppError('There was an error sending the email. Try again later!'),
                500
            );
        }


        res.status(201).json({
            status: 'success',
            data: {
                tech: newTech,
                device: response.data
            }
        });
    } catch (error) {
        if (error.message.includes("Email_1 dup key")) {
            console.log("email already exists")
            return res.status(410).json({message:"email already exists"})}
        else if (error.message.includes("phoneNumber_1 dup key")){
            console.log("phone number already exists")
            return res.status(411).json({message:"phone number already exists"})
        }
        // Handle errors
        console.error('Error creating device:', error);
        next(error);
    }

    next()
});

exports.updatetech = catchAsync(async (req, res, next) => {
    try {
        const Tech = await tech.findByIdAndUpdate(req.params.id, req.body, {

            runValidators: true
        });
        console
    if (!Tech) {
        return next('No technician found with that ID', 404);
    }
    console.log(req.body)
    console.log(Tech);
    const devicePayload = {
        id: Tech.device,
        name: Tech.Fullname,
        uniqueId: Tech._id,
        category: "technician",
    };
    const credentials = Buffer.from('mohamedouesalti080@gmail.com:RZedi!Z9MpqnF@K').toString('base64');


        const response = await axios.put(`https://demo4.traccar.org/api/devices/${Tech.device}`, devicePayload,{

            headers: {
                // Include the encoded credentials in the Authorization header
                Authorization: `Basic ${credentials}`
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                tech: Tech,
                device: response.data
            }
        });
    } catch (error) {
        if (error.message.includes("Email_1 dup key")) {
            console.log("email already exists")
            return res.status(410).json({message:"email already exists"})}
        else if (error.message.includes("phoneNumber_1 dup key")){
            console.log("phone number already exists")
            return res.status(411).json({message:"phone number already exists"})
        }
        // Handle errors
        console.error('Error updating device:', error);
        next(error);
    }

});

exports.deletetech = catchAsync(async (req, res, next) => {
    const Tech = await tech.findByIdAndDelete(req.params.id);

    if (!Tech) {
        return next('No technician found with that ID', 404);
    }

    if (Tech.Status.length > 0) {
        return next('u cant delete an active technicien', 404);
    }
    const credentials = Buffer.from('mohamedouesalti080@gmail.com:RZedi!Z9MpqnF@K').toString('base64');

    try {
        const response = await axios.delete(`https://demo4.traccar.org/api/devices/${Tech.device}`,{

            headers: {
                // Include the encoded credentials in the Authorization header
                Authorization: `Basic ${credentials}`
            }
        });

            console.log('Device deleted successfully:', response.data);
    } catch (error) {
        // Handle errors
        console.error('Error deleting device:', error);
        next(error);
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
});
