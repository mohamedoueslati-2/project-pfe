const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
    timeSpend: Number,
    operationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Operation'
    },
    traveledDistance: Number,
    site: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'site'
    },
    responsable: String,
    driver:Boolean,
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technician'
    },
});

 const Presence = mongoose.model('Presence', presenceSchema);
module.exports = Presence;
