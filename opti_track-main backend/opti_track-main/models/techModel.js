const mongoose=require('mongoose');

const Enum =require('enum');
const {ObjectId} = require("mongodb");
const bcrypt = require("bcryptjs");

    const technicianSchema = new mongoose.Schema({


    firstName: {
            type: String,
            required: true,
        },

        lastName: {
            type: String,
            required: true,
        },
        Email: {
            type: String,
            required: true,
            unique:[true,"Email already exists"],

        },
            password: {
                type: String,
                required: [true, 'Please provide a password'],
                minlength: 8,
            },
        phoneNumber: {
            type: String,
            required: true,
            unique:true,
            validate: {
                validator: function (value) {
                    // Check if the phone number has exactly 8 digits
                    return /^[0-9]{8}$/.test(value);
                },
                message: 'Phone number must be 8 digits long.',
            },
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
        Conge:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Conge',
            }
            ]
        ,
         disponibility : {
            type: Boolean,
            default: true,

        },

        specialization: {
            type: String,
            required: true,
        },
        Permis:{
        type:String,
            enum: ['car', 'truck'],
        required:true,

        }
        ,
            firebaseMessagingToken: {
                type: String,
            },
        device:{
        type:Number,
        },
        currentOperation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Operation',
        },
//tetna7a
        pastOperations: [
            {

                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Operation',
                },


        ],


    },
        { timestamps: true,
            toJSON: { virtuals: true },
           }



);
technicianSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);


    next();
});
technicianSchema.virtual('Fullname').get(function () {

    return `${this.firstName} ${this.lastName}`;
});// Add timestamps for createdAt and updatedAt

// Create the Technician model
    const Technician = mongoose.model('Technician', technicianSchema);

    module.exports = Technician;

