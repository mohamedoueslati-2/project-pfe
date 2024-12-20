const Conge = require('../models/congeModel');
const Technician = require('../models/techModel');
const catchAsync = require('./../utils/catchAsync');

exports.getAllConges = catchAsync(async (req, res, next) => {
    const conges = await Conge.find().populate({
        path: 'technician',
        select: 'Fullname lastName firstName phoneNumber',
        options: {virtuals: true}
    });
    res.status(200).json(

            conges

    );
});

exports.getConge = catchAsync(async (req, res, next) => {
    const conge = await Conge.findById(req.params.id);
    if (!conge) {
        return next('No congé found with that ID', 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            conge
        }
    });
});

exports.createConge = catchAsync(async (req, res, next) => {
    // Check if the technician ID is valid
    const technician = await Technician.findById(req.body.technician);

    if (!technician) {
        return res.status(400).json({ error: 'Invalid technician ID' });
    }

    // Check if the technician has work during the congé period
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const workDay = technician.Status.find(workDay => {
        const workDate = new Date(workDay.date);
        return workDate >= startDate && workDate <= endDate;
    });
    if (workDay) {
        return res.status(400).json({
            error: 'Technician has work scheduled during the congé period',
            date: workDay.date,
            operation: workDay.operation
        });
    }


    const newConge = await Conge.create(req.body);
    technician.Conge.push(newConge._id);
    await technician.save();
    res.status(201).json({
        status: 'success',
        data: {
            conge: newConge
        }
    });
    next();
});


exports.updateConge = catchAsync(async (req, res, next) => {
    const conge = await Conge.findById(req.params.id);
    if (!conge) {
        return next('No congé found with that ID', 404);
    }

    // Check if the technician ID is valid
    const technician = await Technician.findById(conge.technician);
    if (!technician) {
        return res.status(400).json({ error: 'Invalid technician ID' });
    }

    // Check if the technician has work during the updated congé period
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const workDay = technician.Status.find(workDay => {
        const workDate = new Date(workDay.date);
        return workDate >= startDate && workDate <= endDate;
    });
    if (workDay) {
        return res.status(400).json({
            error: 'Technician has work scheduled during the congé period',
            date: workDay.date,
            operation: workDay.operation
        });
    }

    const updatedConge = await Conge.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    res.status(200).json({
        status: 'success',
        data: {
            conge: updatedConge
        }
    });
});

exports.deleteconge = catchAsync(async (req, res, next) => {
    const conge = await Conge.findById(req.params.id);
    if (!conge) {
        return next('No congé found with that ID', 404);
    }

    await Conge.findByIdAndDelete(req.params.id);

    const technician = await Technician.findById(conge.technician);
    if (technician) {
        const index = technician.Conge.indexOf(req.params.id);
        if (index > -1) {
            technician.Conge.splice(index, 1);
            await technician.save();
        }
    }
    res.status(200).json({
        status: 'success',
        data: {
            conge
        }
    });
});