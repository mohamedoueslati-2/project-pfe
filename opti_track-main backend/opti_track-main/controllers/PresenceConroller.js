const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");
const presence = require("../models/PresenceModel");
exports.getAllpres = catchAsync(async (req, res, next) => {
    const features = new APIFeatures(presence.find().populate({
            path: 'operationId',
            select: 'name duration endTime startTime',
        options: { virtuals: true }}).populate({
        path:'site',
        select:'name'
    }), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const pres = await features.query;

    // SEND RESPONSE
    res.status(200).json(

        pres

    );
    next()
});