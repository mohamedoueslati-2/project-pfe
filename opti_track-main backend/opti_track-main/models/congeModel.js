

const mongoose = require('mongoose');
const congeSchema = new mongoose.Schema({
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technician',
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['MALADIE', 'ANNUEL','AUTRE','SANS SOLDE'],
        required: true
    },
   status: {
        type: String,
        enum: ['up coming', 'now', 'passed'],
        default: 'up coming'
    },
    archived: {
        type: Boolean,
        default: false
    }
});
congeSchema.virtual('vacationDates').get(function() {
    const dates = [];
    let currentDate = new Date(this.startDate);

    while (currentDate <= this.returnDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
});

congeSchema.pre('save', async function(next) {
    const overlappingConges = await mongoose.models.Conge.find({
        technician: this.technician,
        $or: [
            { $and: [{ startDate: { $lte: this.endDate } }, { endDate: { $gte: this.startDate } }] },
            { $and: [{ startDate: { $lte: this.returnDate } }, { returnDate: { $gte: this.startDate } }] },
            { $and: [{ endDate: { $lte: this.returnDate } }, { returnDate: { $gte: this.endDate } }] }
        ]
    });

    if (overlappingConges.length > 0) {
        throw new Error('Congé overlaps with existing congés');
    }

    next();
});
//   congeSchema.methods.archiveOldConges = async function() {
//     const currentDate = new Date();
//     const result = await this.updateMany(
//         { returnDate: { $lt: currentDate } },
//         { archived: true }
//     );
//
//     console.log(`Archived ${result.nModified} old Congés.`);
// };
const Conge = mongoose.model('Conge', congeSchema);

module.exports = Conge;