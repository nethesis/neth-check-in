# TravelMap API

### Description
This is a sample NodeJS application that provides API to manage all yours visited city in the world. It can be used as a backend for the [TravelMap UI]

### Configuration
Edit the file `config/config.js` and specify your configuration:
```
var configs = {
    MYSQL_DB_NAME: 'YOUR-DB-NAME',
    MYSQL_DB_HOST: 'localhost',
    MYSQL_DB_PORT: 3306,
    MYSQL_DB_USERNAME: 'root',
    MYSQL_DB_PASSWORD: 'root',
    NODEJS_IP: '127.0.0.1',
    NODEJS_PORT: 8080,
    // is the secret that the UI part uses for all HTTP request
    SECRET: 'YOUR-SECRET',
    // is used for CORS, specify from where requests can be done
    ALLOWED_ORIGIN: 'http://localhost:8000',
    // specify the HTTP verbs for the allowed requests type
    ALLOWED_VERBS: ['GET','PUT','PATCH','POST','DELETE']
};
```

### Build
Install the NodeJS dependecies

`npm install`

### Use
Launch the application

`node server.js`

[TravelMap UI]:https://github.com/edospadoni/travelmap-ui