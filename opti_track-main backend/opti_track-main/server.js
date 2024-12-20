const mongoose = require('mongoose');
const dotenv = require('dotenv');
const scheduler = require('./schedular'); // Adjust the path accordingly
const http = require('http');

const axios = require('axios'); // Make sure to install axios using npm install axios



dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE;


mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,

  })
  .then(() => console.log('DB connection successful!'));
const server = http.createServer( app);
const port =  3001;
 server.listen(port, () => {
  console.log(`App running on port ${port}...`);
  
});


