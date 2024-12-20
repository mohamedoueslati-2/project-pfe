const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const siteRouter = require('./routes/siteRoutes');
const techRouter = require('./routes/techRoutes');
const vehRouter = require('./routes/vehRoutes');
const operationRouter = require('./routes/OperationRoute');
const congeRouter = require('./routes/congeRoutes');
const presRouter = require('./routes/presenceRoutes');
const userRouter = require('./routes/userRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const axios = require('axios'); // Make sure to install axios using npm install axios



const app = express();
app.use(helmet());

// const limiter = rateLimit({
//   max: 150,
//   windowMs: 60 * 60 * 1000,
//   message: 'Too many requests from this IP, please try again in an hour!'
// });
// app.use('/', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

app.use((req, res, next) => {
  const headersSize = Buffer.byteLength(JSON.stringify(req.headers), 'utf8');
  console.log(`Size of headers: ${headersSize} bytes`);
  next();
});

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());



// 3) ROUTES
app.use('/site', siteRouter);
app.use('/tech',techRouter);
app.use('/vehicule',vehRouter);
app.use('/operation',operationRouter);
app.use('/conge',congeRouter);
app.use('/presence',presRouter);
app.use('/user',userRouter);
// app.get('/get-cookie', async (req, res) => {
//   try {
//     // const response = await axios.get('https://demo.traccar.org/api/session?token=SDBGAiEA2FGiqwpHXnD4RGD8BKRBSaXOVms9-PXh4QH1DaFR9JoCIQDYh0kTUZRAbTlH0FLo-0wjB1_bhuMwOWKID-jW-6tOEHsidSI6NTUwMjYsImUiOiIyMDI1LTAxLTIxVDIzOjAwOjAwLjAwMCswMDowMCJ9');
//     const setCookieHeader = response.headers['set-cookie'][0];
//     res.json({ cookie: setCookieHeader });
//   } catch (error) {
//     console.error('Error during HTTP session: ', error);
//     res.status(500).json({ error: 'Failed to get cookie' });
//   }
// });



module.exports = app;
