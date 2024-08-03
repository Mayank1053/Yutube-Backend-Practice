class ApiError extends Error {
  constructor(
    statusCode,
    message = "Internal Server Error",
    errors = [],
    stack = ""
  ) {
    // What is super()?
    // The super keyword is used to access and call functions on an object's parent.
    // The super.prop and super[expr] expressions are valid in any method definition in both classes and object literals.
    // The super() constructor allows to call the constructor of a parent class.
    super(message);
    this.data = null;
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;

    // If stack is passed, use it. Otherwise, capture the stack trace
    if (stack) {
      this.stack = stack;
    } else {
      // This is a Node.js Error stack trace
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;