const http = require("http");
require("dotenv").config();
const bend = require("./bend");

const port = process.env.PORT || 4000;

const server = http.createServer(bend);

server.listen(port, () => {
    console.log(`Server is listening to port ${port}`);
});