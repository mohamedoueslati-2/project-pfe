const cron = require('node-cron');
const Operation = require('./models/operation_Model');
const Technician = require('./models/techModel');
const Vehicle = require('./models/vehModel');
const Conge = require('./models/congeModel');

// Schedule the archiveOldConges function to run every day at 00:00
async function archiveOldConges() {
    const currentDate = new Date();
    const result = await Conge.updateMany(
        { returnDate: { $lt: currentDate } },
        { archived: true }
    );

    console.log(`Archived ${result.nModified} old Congés.`);
};
cron.schedule('* * * * *', async () => {
    try {
        await archiveOldConges();
        console.log('Successfully archived old Congés.');
    } catch (error) {
        console.error('Failed to archive old Congés:', error);
    }
});

// const updateOperationStatus = async () => {
//     const currentDateTime = new Date();
//     try {
//         // Update operation status
//         const result = await Operation.updateMany(
//             {
//                 startTime: { $lte: currentDateTime },
//                 status: 'Planned',
//             },
//             { $set: { status: 'In Progress' } }
//         );
//
//         console.log(`${result.nModified} operation(s) updated successfully.`);
//
//     } catch (error) {
//         console.error('Error updating operation statuses and clearing unavailability arrays:', error);
//     }
// };
const updateOperationStatus = async () => {
    const currentDateTime = new Date();
    try {
        // Find operations that should be updated
        const operations = await Operation.find({
            startTime: { $lte: currentDateTime },
            status: 'Planned',
        });

        for (const operation of operations) {
            // Update operation status
            operation.status = 'In Progress';
            const technicians = operation.technicians;
            await operation.save();
            for (const technician of technicians) {
                const  technicien= await Technician.findById(technician);
                technicien.currentOperation = operation._id;
              await technicien.save();
                console.log("aaaa",technicien.currentOperation)
            }

            console.log(`Operation ${operation._id} updated successfully.`);
        }
    } catch (error) {
        console.error('Error updating operation statuses and updating technicians:', error);
    }
};
// const clearUnavailabilityArrays = async () => {
//     const currentDateTime = new Date();
//
//     try {
//         await Technician.updateMany(
//             {},
//             { $pull: { unavailability: { date: { $lt: currentDateTime } } } }
//         );
//
//         await Vehicle.updateMany(
//             {},
//             { $pull: { unavailability: { date: { $lt: currentDateTime } } } }
//         );
//
//         console.log('Unavailability arrays cleared successfully.');
//     } catch (error) {
//         console.error('Error clearing unavailability arrays:', error);
//     }
// };

async function updateCongeStatus() {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set the time to 00:00

    // Update the status to 'Now' for Conges where the current date is within the start and return dates
    await Conge.updateMany(
        { startDate: { $lte: currentDate }, returnDate: { $gte: currentDate } },
        { status: 'Now' }
    );

    // Update the status to 'Upcoming' for Conges where the start date is greater than the current date
    await Conge.updateMany(
        { startDate: { $gt: currentDate } },
        { status: 'Upcoming' }
    );

    // Update the status to 'Passed' for Conges where the return date is less than the current date
    await Conge.updateMany(
        { returnDate: { $lt: currentDate } },
        { status: 'Passed' }
    );

    console.log('Updated Congé statuses.');
};
cron.schedule('* * * * *', updateOperationStatus);
cron.schedule('* * * * *', updateCongeStatus);
cron.schedule('* * * * *', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all Technician documents
    const technicians = await Technician.find().populate('Conge');

    for (const technician of technicians) {
        // If the technician has a Congé document
        if (technician.Conge && technician.Conge.length > 0) {
            // Filter the Conge array based on the archived field
            const activeConges = technician.Conge.filter(conge => !conge.archived);

            for (const conge of activeConges) {
                let isOnVacation = false;

                // If the current date is within the start and end dates of the vacation period
                if (today >= conge.startDate && today <= conge.returnDate) {
                    isOnVacation = true;
                    break;
                }

                // If the technician is on vacation but their disponibility is true, set it to false
                if (isOnVacation && technician.disponibility) {
                    technician.disponibility = false;

                }

                // If the technician is not on vacation but their disponibility is false, set it to true
                if (!isOnVacation && !technician.disponibility) {
                    technician.disponibility = true;
                }

                await technician.save();

                console.log('Congé status updated successfully');
            }
        } else {
            // The technician has no Congé document, so if their disponibility is false, set it to true
            if (!technician.disponibility) {
                technician.disponibility = true;
                await technician.save();
            }
        }
    }
});