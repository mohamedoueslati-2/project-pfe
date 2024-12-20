const site = require('../models/siteModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const axios = require('axios');
// const adminKey =uNfum2arPXDFpwJrieGMaL6CEEtOinAkf9afGd6w5ebhsFcl;
// const apiKey =PPDnoir69epGxtQlk07ueRzk6cF76Hft;
// const projectId=d0d3aef3-c1ee-40ba-9f88-ac305aa12fa6;

exports.getAllSite = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(site.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const sites = await features.query;

  // SEND RESPONSE
  res.status(200).json(
      sites
  );
  next()
});

exports.getSite = catchAsync(async (req, res, next) => {
  const Site = await site.findById(req.params.id);

  if (!Site) {
    return next('No site found with that ID', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      Site
    }
  });
});
const Sotetel = [10.210557325592731,36.8530881166092];
exports.createSite = catchAsync(async (req, res, next) => {
  // Extract latitude and longitude from request body
  const { latitude, longitude } = req.body;

  // Construct waypointsString
  const waypointsString = `36.8530881166092,10.210557325592731|${longitude},${latitude}`;

  // Send GET request to Geoapify API
  const response = await axios.get(`https://api.geoapify.com/v1/routing?waypoints=${waypointsString}&mode=drive&apiKey=e327a1988cea41ea9b80b0225c329861`);

  // Extract time from response, convert to hours, and round up
  console.log(response)
  console.log(response.data.features[0].properties.time, 'time',response.data.features[0].properties.time / 3600)

  const duration = Math.ceil(response.data.features[0].properties.time / 3600);

  // Add duration to request body
  req.body.duration = duration;

  // Continue with site creation as before
  const newSite = await site.create(req.body);

  // Send response to client
  res.status(201).json({
    status: 'success',
    data: {
      site: newSite,
    }
  });
});

exports.updateSite = catchAsync(async (req, res, next) => {
  // Extract latitude and longitude from request body
  const { latitude, longitude } = req.body;

  // Construct waypointsString
  const waypointsString = `36.8530881166092,10.210557325592731|${longitude},${latitude}`;

  // Send GET request to Geoapify API
  const response = await axios.get(`https://api.geoapify.com/v1/routing?waypoints=${waypointsString}&mode=drive&apiKey=e327a1988cea41ea9b80b0225c329861`);

  // Extract time from response, convert to hours, and round up
  const distance = Math.round(response.data.features[0].properties.distance / 1000);

  // Add duration to request body
  req.body.distance = distance;

  // Update the site
  const Site = await site.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!Site) {
    return next('No site found with that ID', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      Site
    }
  });
});

exports.deleteSite = catchAsync(async (req, res, next) => {
  const Site = await site.findByIdAndDelete(req.params.id);

  if (!Site) {
    return next('No site found with that ID', 404);
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
