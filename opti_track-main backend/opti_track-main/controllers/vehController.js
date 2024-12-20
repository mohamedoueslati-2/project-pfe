const vehi = require('../models/vehModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const tech = require("../models/techModel");
const axios = require("axios");

exports.getAllvehicules = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(vehi.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const veh = await features.query;

    // SEND RESPONSE
    res.status(200).json(

        veh

    );
    next()
});
exports.getAvailableveh = catchAsync(async (req, res, next) => {

    try {
        const{ operationDays ,technumber,Permis}= req.body;
        if (!operationDays) {

            return next('Please provide operation days in the request body.', 400);
        }

        const availablevehicules = await vehi.find({
            disponibility: "disponible",
            Status: { $not: { $elemMatch: { date: { $in: operationDays } } } },
            seats: { $gte: technumber },
            type:Permis
        });

        res.json(availablevehicules);
    } catch (error) {
        console.error("Error fetching available technicians:", error);
        res.status(500).json({ error: "Failed to fetch available technicians from the database." });
    }
});
exports.getAvailableveh_update = catchAsync(async (req, res, next) => {

    try {
        const{ operationDays,Permis ,technumber,operation_id}= req.body;
        if (!operationDays) {

            return next('Please provide operation days in the request body.', 400);
        }

        let availablevehicules = await vehi.find({
            disponibility: "disponible",
            seats: { $gte: technumber },
            type: Permis,
            $or: [
                { Status: { $not: { $elemMatch: { date: { $in: operationDays } } } } },
                { Status: { $elemMatch: { date: { $in: operationDays }, operationId: operation_id } } }
            ]
        });

        res.json(availablevehicules);
    } catch (error) {
        console.error("Error fetching available technicians:", error);
        res.status(500).json({ error: "Failed to fetch available technicians from the database." });
    }
});
exports.getvehicule = catchAsync(async (req, res, next) => {
    const veh = await vehi.findById(req.params.id);

    if (!veh) {
        return next('No car found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            veh
        }
    });
});

exports.createvehicule= catchAsync(async (req, res, next) => {
    try {
    const newvehicule = await vehi.create(req.body);
    const { licensePlate,_id } = newvehicule;
    const vehPayload = {
        name: licensePlate,
        uniqueId:_id,
        category: "vehicule",
    };
    const credentials = Buffer.from('mohamedouesalti080@gmail.com:RZedi!Z9MpqnF@K').toString('base64');



        const response = await axios.post("https://demo4.traccar.org/api/devices",vehPayload,{

            headers: {
                // Include the encoded credentials in the Authorization header
                Authorization: `Basic ${credentials}`
            }
        });

        newvehicule.device = response.data.id;
        await newvehicule.save();
        console.log('veh created successfully:', response.data);


        res.status(201).json({
            status: 'success',
            data: {
                veh: newvehicule,
                device: response.data
            }
        });
    } catch (error) {
        if (error.message.includes("licensePlate_1 dup key")) {
            console.log("license already exists")
            return res.status(410).json({message:"license already exists"})}


        // Handle errors
        console.error('Error creating device:', error);
        next(error);
    }

    next()

});

exports.updatevehicule = catchAsync(async (req, res, next) => {
    try {
    const veh = await vehi.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!veh) {
        return next('No car found with that ID', 404);
    }
    const { licensePlate, _id } = veh;
    const vehPayload = {
        id: veh.device,
        name: licensePlate,
        uniqueId: _id,
        category: "vehicule",
    };
    const credentials = Buffer.from('mohamedouesalti080@gmail.com:RZedi!Z9MpqnF@K').toString('base64');


        const response = await axios.put(`https://demo4.traccar.org/api/devices/${veh.device}`, vehPayload, {
            headers: {
                Authorization: `Basic ${credentials}`
            }
        });

        console.log('Vehicle updated successfully:', response.data);

        res.status(200).json({
            status: 'success',
            data: {
                veh,
                device: response.data
            }
        });
    } catch (error) {
        console.error("error",error.message)
        if (error.message.includes("licensePlate_1 dup key")) {
            console.log("license already exists")
            return res.status(410).json({message:"license already exists"})}
        console.error('Error updating device:', error);
        next(error);
    }
});



exports.deletevehicule = catchAsync(async (req, res, next) => {
    const veh = await vehi.findByIdAndDelete(req.params.id);

    if (!veh) {
        return next('No car found with that ID', 404);
    }
    const credentials = Buffer.from('mohamedouesalti080@gmail.com:RZedi!Z9MpqnF@K').toString('base64');

    try {
        const response = await axios.delete(`https://demo4.traccar.org/api/devices/${veh.device}`, {
            headers: {
                Authorization: `Basic ${credentials}`
            }
        });

        console.log('Vehicle deleted successfully:', response.data);

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        console.error('Error deleting device:', error);
        next(error);
    }
});
