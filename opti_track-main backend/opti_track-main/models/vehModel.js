const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true,
    },
    model: {
        type: String,
        required: true,
    },
    seats:{
        type: Number,
    required: true,
    min: 2,
    max: 5,
    },
    type: {
        type: String,
        enum: ['car','truck'],
        required: true
    },
    year: {
        type: Number,
        required: true,
    },
    licensePlate: {
        type: String,
        required: true,
        unique: true,
    },

    device: {
        type: Number,
    },

    Status: [
        {
            operationId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Operation',
                required: true,
            },
            date: {
                type: Date,
                required: true,
            },
        },
    ],
    disponibility: {
        type: String,
        enum: ['disponible', 'indisponible'],
        default: 'disponible',
    },
    //tetna7a
    pastOperations: [
        {

            type: mongoose.Schema.Types.ObjectId,
            ref: 'Operation',
        },


    ]
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
