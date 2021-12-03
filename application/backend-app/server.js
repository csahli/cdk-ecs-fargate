require("./models/dbinit.js");


const promBundle = require("express-prom-bundle");
const metricsMiddleware = promBundle({
    autoregister: true,
    includeStatusCode: true,
    includePath: true,
    includeMethod: true
});

var AWSXRay = require('aws-xray-sdk');
AWSXRay.config([AWSXRay.plugins.EC2Plugin,AWSXRay.plugins.ECSPlugin]);
var rules = {
    "rules": [ { "description": "Customers API.", "service_name": "*", "http_method": "*", "url_path": "/customers/*", "fixed_target": 0, "rate": 0.05 } ],
    "default": { "fixed_target": 1, "rate": 0.1 },
    "version": 1
}
AWSXRay.middleware.setSamplingRules(rules);


const express = require("express");
const app = express();

app.use(metricsMiddleware);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
//app.use("/((?!health))*", promBundle({includePath: true}));

app.listen(process.env.NOPEPORT || 3000, () => {
    console.log("*** Backend app is ready to serve traffic"); 
}); 

require("./routes/customer.routes.js")(app);

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to my rest application." });
});

// health route
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

