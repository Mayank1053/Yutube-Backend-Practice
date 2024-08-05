import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Express Request middleware
// app.use() is used to add middleware to the application.
app.use(cors({           
  // Cross-Origin Resource Sharing (CORS) is a security feature that restricts what resources a web page can request from another domain.
  origin: process.env.CLIENT_URL,
  // The origin property specifies the domains that are allowed to access the resources of the server.
  credentials: true,
}));
app.use(express.json({   
  // The express.json() middleware is used to parse JSON bodies in the request.
  limit: "16kb",
  // The limit option is used to limit the size of the request body.
}));
app.use(express.urlencoded({
  // The express.urlencoded() middleware is used to parse URL-encoded bodies in the request.
  extended: true,
  limit: "16kb",
}));
app.use(express.static("public")); 
// The express.static() middleware is used to serve static files from the public directory.
app.use(cookieParser());
// The cookieParser() middleware is used to parse cookies in the request.


export default app;