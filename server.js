const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

const filesRoutes = require('./routes/files');
const locksRoutes = require('./routes/locks');
const requestsRoutes = require('./routes/requests');

app.use('/api/files', filesRoutes);
app.use('/api/locks', locksRoutes);
app.use('/api/requests', requestsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'File Lock API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});