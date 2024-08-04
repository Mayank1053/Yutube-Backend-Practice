// Note: API Response Class
// Why do we need this file?
// We need this file to create a standard response format for our API responses.
// We use the ApiResponse class to create an instance of the response with the status code, data, and message.
class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode >= 200 && statusCode < 300;
    // The success property is used to check if the response is successful or not.
    // If the status code is between 200 and 299, the success property is set to true.
  }
}