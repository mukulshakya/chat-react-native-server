const { payloads } = require("../config/constants.json");
const { putPayload } = require("../util/validator/validator");
const schemas = require("../util/validator/schemas");

module.exports = (type) => async (req, res, next) => {
  try {
    const errors = {};
    const body = {};
    for (const field of payloads[type]) {
      if (req.body[field] || req.body[field] === "")
        putPayload({ [field]: req.body[field].trim() });
      const { errors: fieldErrors } = schemas[field]();
      if (fieldErrors.length) errors[field] = fieldErrors.join(", ");
      else
        body[field] =
          typeof req.body[field] === "string"
            ? String(req.body[field]).trim().toLowerCase()
            : req.body[field];
    }
    if (Object.keys(errors).length) return res.error(errors);

    req.body = body;
    next();
  } catch (e) {
    next(e);
  }
};
