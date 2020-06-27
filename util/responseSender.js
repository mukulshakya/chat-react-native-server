module.exports = {
  success: function (data = {}, message = "Action was successfull") {
    return this.status(200).json({ success: true, message, data });
  },
  unAuth: function (data = {}, message = "Action was successfull") {
    return this.status(401).json({ success: false, message, data });
  },
  error: function (errors = {}, message = "Action was unsuccessfull") {
    const { name, message: msg, stack } = errors;
    return this.status(200).json({
      success: false,
      message,
      errors: name && msg && stack ? { name, message: msg, stack } : errors,
    });
  },
};
