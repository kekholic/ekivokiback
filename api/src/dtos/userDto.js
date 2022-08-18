module.exports = class UserDto {
  email;

  id;

  appruvedMail;

  constructor(model) {
    this.id = model.id;
    this.email = model.email;
    this.username = model.username;
    this.appruvedMail = model.appruvedMail;
  }
};
