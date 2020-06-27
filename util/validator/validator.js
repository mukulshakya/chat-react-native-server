const payload = {};
class Validator {
  constructor(field) {
    this.field = field;
    this.errors = [];
  }
  required() {
    !payload.hasOwnProperty(this.field)
      ? this.errors.push(this.field + " is required")
      : !payload[this.field] &&
        this.errors.push(this.field + " can't be empty");

    return this;
  }
  email() {
    const pattern = /^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/;
    payload[this.field] &&
      !pattern.test(payload[this.field]) &&
      this.errors.push(this.field + " is invalid");

    return this;
  }
  min(num) {
    payload[this.field] &&
      payload[this.field].length < num &&
      this.errors.push(`${this.field} length must be greater than ${num - 1}`);

    return this;
  }
  max(num) {
    payload[this.field] &&
      payload[this.field].length > num &&
      this.errors.push(`${this.field} length must be less than ${num + 1}`);

    return this;
  }
}

module.exports = {
  Validator,
  putPayload: (updates) => Object.assign(payload, updates),
};
