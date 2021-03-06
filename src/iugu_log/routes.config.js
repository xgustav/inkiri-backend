const IuguLogController     = require('./controllers/iugu_log.controller');
const ValidationMiddleware  = require('../common/middlewares/auth.validation.middleware');
const PermissionMiddleware  = require('../common/middlewares/auth.permission.middleware');
const config                = require('../common/config/env.config');

exports.routesConfig = function (app) {

    // app.post(config.api_version+'/iugu_log', [
    //     IuguLogController.insert
    // ]);
    app.get(config.api_version+'/iugu_log', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        IuguLogController.list
    ]);
    app.get(config.api_version+'/iugu_log/:iuguLogId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        IuguLogController.getById
    ]);
    // app.patch(config.api_version+'/iugu_log/:iuguLogId', [
    //     ValidationMiddleware.validJWTNeeded,
    //     IuguLogController.patchById
    // ]);
    // app.delete(config.api_version+'/iugu_log/:iuguLogId', [
    //     ValidationMiddleware.validJWTNeeded,
    //     IuguLogController.removeById
    // ]);
};
