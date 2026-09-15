module.exports = function sendError(res, status, error, details) {
  return res.status(status).json({ error, details });
};
