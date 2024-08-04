// Why do we need this file?
// We need this file to handle the asynchronous functions in our route handlers.
// We use the asyncHandler function to wrap the route handlers and catch any errors that occur.
// The asyncHandler function takes a function as an argument and returns a new function that takes three arguments: req, res, and next.
const asyncHandler = (fn) => (req, res, next) =>
  // what is Promise.resolve()?
  // Promise.resolve() is a method that returns a promise that is resolved with the given value.
  // The method is used to handle the promise rejection.
  // The method is used to wrap the function in a promise.
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  // what is next()?
  // next() is a function that is called to pass control to the next middleware function.

export default asyncHandler;

// Another way to write the asyncHandler function
// How does this method works?
// The asyncHandler function takes a function as an argument. This is called higher-order function.
// The function returns a new function that takes three arguments: req, res, and next.
// The new function calls the function with the req, res, and next arguments.
// The function returns a promise that is resolved with the result of the function.

// cosnt asyncHandler = fn => (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//       res.status(err.code || 500).json({
//         success: false,
//         message: err.message
//       });
//     }
// }

// Which method is better?
// The first method is better because it uses the Promise.resolve() method to handle the promise rejection.
// The second method uses a try-catch block to handle the promise rejection.
// The first method is more concise and easier to read.
// The second method is more verbose and harder to read.
// The first method is more idiomatic and follows best practices.