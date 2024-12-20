const mongoose = require('mongoose');
const tech = require('../models/techModel');
const vehi = require('../models/vehModel');
const Site = require('../models/siteModel');
const axios = require('axios');
const Presence = require('./PresenceModel');
const operationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    accessCode: {
        type: String,
    },
    Marche: {
        type: String,
        required: true,
    },
    Description: {
        type: String,
    },


    site: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'site',
        required: true,
    },
    technicians: [
             {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Technician',
required:true,
            },

    ],
    responsable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technician',
         required: true,
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technician',
         required: true,
    },
    vehicle:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true,
        },
        user:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

group: {
    type:Number,
},
    status: {
        type: String,
        enum: ['Planned', 'In Progress', 'Completed',"Canceled"],
        default: 'Planned',
    },
        // operationDays:[
        //     {
        //         type: Date,
        //         required:true,
        //     },
        //
        // ],

    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
createdAt: {
    type: Date,
    default: Date.now,
},
},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }

});
// operationSchema.path('technicians').validate({
//     validator: async function () {
//         const unavailableTechnicians = await Promise.all(
//             this.technicians.map(async (technicianId) => {
//                 const technician = await tech.findById(technicianId);
//
//                 if (!technician) {
//                     return null; // Handle missing technician
//                 }
//                 else if(technician.disponibility!== "disponible") {
//                   return technician._id;
//                  }
//
//
//                 else {
//                     for (const date of this.operationDays) {
//                         if (technician.unavailability.some((unavailableDate) => unavailableDate.date.toString() === date.toString())) {
//                             return technician._id;
//                         }
//                     }
//                 }
//
//                 return null;
//             })
//         );
//
//         const validTechnicians = unavailableTechnicians.filter((techId) => techId !== null);
//
//         if (validTechnicians.length > 0) {
//             const errorMessage = `Technician(s) with ID(s) ${validTechnicians.join(',')} is/are unavailable.`;
//             throw new Error(errorMessage);
//         }
//
//         return true;
//     },
//     message: 'Technician(s) are unavailable for the specified operation period.',
// });

operationSchema.path('responsable').validate({
    validator: async function () {

        if (!this.technicians.includes((this.responsable._id))) {
            const errorMessage = `responsable with ID(s) ${this.responsable._id} is not from the crew .`;
            throw new Error(errorMessage);
        }
        else if (!this.technicians.includes((this.driver._id))) {
            const errorMessage = `driver with ID(s) ${this.driver._id} is not from the crew .`;
            throw new Error(errorMessage);
        }
        const vehicle = await vehi.findById(this.vehicle._id);
        const Driver = await tech.findById(this.driver._id);

        if (Driver.Permis !== vehicle.type) {
            const errorMessage = `driver with ID(s) ${this.driver._id} is not capable of driving this type of vehicule ${vehicle.type}.`;
            throw new Error(errorMessage);
        }
        return true;
    },

});
operationSchema.path('driver').validate({
    validator: async function () {

        if (!this.technicians.includes((this.driver._id))) {
            const errorMessage = `driver with ID(s) ${this.driver._id} is not from the crew .`;
            throw new Error(errorMessage);
        }
        const vehicle = await vehi.findById(this.vehicle._id);
        const Driver = await tech.findById(this.driver._id);

        if (Driver.Permis !== vehicle.type) {
            const errorMessage = `driver with ID(s) ${this.driver._id} is not capable of driving this type of vehicule ${vehicle.type}.`;
            throw new Error(errorMessage);
        }
        return true;
    },

});

// operationSchema.path('technicians').validate({
//     validator: async function () {
//         const unavailableTechnicians = await Promise.all(
//             this.technicians.map(async (technicianId) => {
//                 const technician = await tech.findById(technicianId);
//                 if (technician && technician.disponibility!== "disponible") {
//                     return technician.get('_id')._id;
//                 }
// return null;
//             })
//         );
//
//         const validTechnicians = unavailableTechnicians.filter((techId) => techId !== null);
//         if (validTechnicians.length > 0) {
//             const errorMessage = `Technician(s) with ID(s) ${validTechnicians.join(',')} is/are unavailable.`;
//             throw new Error(errorMessage);
//         }
//
//         return true;
//     },
//     message: 'Technician(s) are unavailable for the specified operation period.',
// });
operationSchema.path('technicians').validate({
    validator: function(value) {
        return value.length >= 1;
    },
    message: 'An operation must have at least two technicians.',
});
operationSchema.path('vehicle').validate({
    validator: async function() {
        const vehicleId = this.vehicle._id;
        const vehicle = await vehi.findById(vehicleId);


        const totalTechnicians = this.technicians.length;
        if (totalTechnicians > vehicle.seats) {
            const errorMessage = `The total number of technicians (${totalTechnicians}) exceeds the available seats in the vehicle.`;
            throw new Error(errorMessage);
        }

        return true;
    },
    message: 'Vehicle is insufficient seats for the specified operation period.',
});
operationSchema.virtual('duration').get(function () {
    const start = this.startTime;
    const end = this.endTime;
    const durationInMilliseconds = end - start;
    const durationInDays = durationInMilliseconds / (1000 * 60 * 60 * 24);
    return Math.ceil(durationInDays);
});
// operationSchema.virtual('info').get(function () {
//     const start = this.startTime;
//     const end = this.endTime;
//     const durationInMilliseconds = end - start;
//     const durationInDays = durationInMilliseconds / (1000 * 60 * 60 * 24);
//     return Math.round(durationInDays);
// });
const credentials = Buffer.from('mohamedouesalti080@gmail.com:RZedi!Z9MpqnF@K').toString('base64');

async function sendRequest(method, url, payload) {
    try {
        const response = await axios({
            method,
            url,
            data: payload,
            headers: {
                Authorization: `Basic ${credentials}`
            }
        });
        console.log('Request successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending request:', error);
    }
}

const Operation = mongoose.model('Operation', operationSchema);

module.exports = Operation;
