const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A site must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A site name must have less or equal then 40 characters'],
            minlength: [5, 'A site name must have more or equal then 10 characters']

        },

        address: {
            type: String,
            required: [true, 'A site must have a address'],
            maxlength: [40, 'A site address must have less or equal then 40 characters'],
            minlength: [10, 'A site address must have more or equal then 10 characters']
        },
        // coordinates: {
        //     type: [Number], //string
        //     required: true
        // },
        longitude: {
            type: Number,
            required: true
        },
        latitude: {
            type: Number,
            required: true
        },
        state: {
            type: String,
            required: true,
        },
        geofence: {
            type:Number,
        }
        ,
        city: {
            type: String,
            required: true,
        },
        distance: {
            type: Number,
            required: true,
        },
        //tetna7a
        pastOperations: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Operation',
            },


        ]
    });

const site = mongoose.model('site',siteSchema );

module.exports = site;
