const VerifyRequestMiddleware = require('./middlewares/verify.request.middleware');
const RequestsController = require('./controllers/requests.controller');
const PermissionMiddleware = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const config = require('../common/config/env.config');

const ADMIN = config.permission_levels.ADMIN;
const OPS = config.permission_levels.OPS_USER;
const FREE = config.permission_levels.NORMAL_USER;

exports.routesConfig = function (app) {
    app.post(config.api_version+'/requests', [
        ValidationMiddleware.validJWTNeeded,
        VerifyRequestMiddleware.validAccountReferences,
        VerifyRequestMiddleware.validRequiredFields,
        RequestsController.insert
    ]);
    app.get(config.api_version+'/requests', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(OPS),
        RequestsController.list
    ]);
    app.get(config.api_version+'/requests/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        RequestsController.getById
    ]);
    app.patch(config.api_version+'/requests/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        // PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        // PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        RequestsController.patchById
    ]);
    app.delete(config.api_version+'/requests/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(OPS),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        RequestsController.removeById
    ]);
};