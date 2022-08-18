const ApiError = require('../exceptions/apiError');
const tokenService = require('../service/tokenService');

module.exports = function authMiddleware(req, res, next) {
  try {
    // // console.log('aaaaa')
    const authorizationHeader = req.headers.authorization;
    // // console.log('authorizationHeader: ', authorizationHeader);
    if (!authorizationHeader) {
      return next(ApiError.UnauthorizedError());
    }

    const accessToken = authorizationHeader.split(' ')[1];
    if (!accessToken) {
      return next(ApiError.UnauthorizedError());
    }

    const userData = tokenService.validateAccessToken(accessToken);
    // // console.log('userData: ', userData);
    if (!userData) {
      return next(ApiError.UnauthorizedError());
    }

    req.user = userData;
    return next();
  } catch (e) {
    return next(ApiError.UnauthorizedError());
  }
};
