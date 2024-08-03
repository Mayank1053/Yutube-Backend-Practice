const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));

export default asyncHandler;

// Another way to write the asyncHandler function

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
