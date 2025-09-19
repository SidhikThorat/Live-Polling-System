require('dotenv').config()

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@<cluster-url>/live-polling-system?retryWrites=true&w=majority',
  NODE_ENV: process.env.NODE_ENV || 'development',
}
