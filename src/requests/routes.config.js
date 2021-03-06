const VerifyRequestMiddleware       = require('./middlewares/verify.request.middleware');
const RequestStateMachineMiddleware = require('./middlewares/state_machine.middleware');
const RequestsController            = require('./controllers/requests.controller');
const RequestsModel                 = require('./models/requests.model');
const PermissionMiddleware          = require('../common/middlewares/auth.permission.middleware');
const ValidationMiddleware          = require('../common/middlewares/auth.validation.middleware');
const config                        = require('../common/config/env.config');
const GoogleDriveMiddleware         = require('../files/middlewares/googledrive.middleware');
var Multer  = require('multer');

const multer = Multer({
  storage: Multer.MemoryStorage
  , limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
  , fileFilter: function (req, file, cb) {
      const accepted_mime_types = [ "application/pdf", "image/png", "image/jpeg"];
      console.log('** Multer.fileFilter => ', file.mimetype)
      if (!accepted_mime_types.includes(file.mimetype) ) {
          req.fileValidationError = 'Wrong mimetype. Only PDF, PNG ad JPG/JPEG files accepted!';
          return cb(null, false, new Error('Only PDF, PNG ad JPG/JPEG files accepted!'));
      }
      cb(null, true);
    }
});

var multer_multi_file_conf = multer.fields([
  { name: RequestsModel.ATTACH_NOTA_FISCAL, maxCount: 1 },
  { name: RequestsModel.ATTACH_BOLETO_PAGAMENTO, maxCount: 1 },
  { name: RequestsModel.ATTACH_COMPROBANTE, maxCount: 1 }
]);

exports.routesConfig = function (app) {
    app.post(config.api_version+'/requests', [
        ValidationMiddleware.validJWTNeeded,
        VerifyRequestMiddleware.validAccountReferences,
        VerifyRequestMiddleware.validRequiredFields,
        VerifyRequestMiddleware.validateIfServiceRequestFields,
        VerifyRequestMiddleware.loggedHasAdminWritePermission,
        RequestsController.insert
    ]);

    app.get(config.api_version+'/requests', [
        ValidationMiddleware.validJWTNeeded,
        RequestsController.list
    ]);

    app.get(config.api_version+'/requests/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        RequestsController.getById
    ]);

    app.get(config.api_version+'/requests_by_counter/:counterId', [
        ValidationMiddleware.validJWTNeeded,
        RequestsController.getByCounter
    ]);

    app.patch(config.api_version+'/requests/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        VerifyRequestMiddleware.validRequestObject,
        RequestStateMachineMiddleware.validateTransition,
        RequestsController.patchById
    ]);

    app.patch(config.api_version+'/requests_admin/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        VerifyRequestMiddleware.validRequestObject,
        RequestStateMachineMiddleware.validateTransitionForAdmin,
        RequestsController.patchById
    ]);

    // app.patch(config.api_version+'/requests_c2c/:requestId', [
    //     ValidationMiddleware.validJWTNeeded,
    //     VerifyRequestMiddleware.validRequestObject,
    //     RequestStateMachineMiddleware.validateTransitionC2C,
    //     RequestsController.patchById
    // ]);

    app.patch(config.api_version+'/requests_c2c_by_sender/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        VerifyRequestMiddleware.validRequestObject,
        RequestStateMachineMiddleware.validateC2CTransitionFor(RequestStateMachineMiddleware.REQUEST_USER_SENDER),
        RequestsController.patchById
    ]);

    app.patch(config.api_version+'/requests_c2c_by_receiver/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        VerifyRequestMiddleware.validRequestObject,
        RequestStateMachineMiddleware.validateC2CTransitionFor(RequestStateMachineMiddleware.REQUEST_USER_RECEIVER),
        RequestsController.patchById
    ]);

    app.patch(config.api_version+'/requests_c2c_by_admin/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        VerifyRequestMiddleware.validRequestObject,
        RequestStateMachineMiddleware.validateC2CTransitionFor(RequestStateMachineMiddleware.REQUEST_USER_ADMIN),
        RequestsController.patchById
    ]);

    app.delete(config.api_version+'/requests/:requestId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.loggedHasAdminWritePermission,
        RequestsController.removeById
    ]);


    app.post(config.api_version+'/requests_files'
        , multer_multi_file_conf
        ,[
          ValidationMiddleware.validJWTNeeded,
          VerifyRequestMiddleware.validAccountReferences,
          VerifyRequestMiddleware.validRequiredFields,
          VerifyRequestMiddleware.explodeFormData,
          GoogleDriveMiddleware.validMimeTypes,
          GoogleDriveMiddleware.uploadFiles,
          RequestsController.insert_files
        ]
    );

    app.post(config.api_version+'/requests_files/:requestId'
        , multer_multi_file_conf
        ,[
          ValidationMiddleware.validJWTNeeded,
          VerifyRequestMiddleware.explodeFormData,
          GoogleDriveMiddleware.validMimeTypes,
          VerifyRequestMiddleware.validRequestObject,
          RequestStateMachineMiddleware.validateTransition,
          GoogleDriveMiddleware.uploadFiles,
          RequestsController.update_files
        ]
    );

    app.post(config.api_version+'/requests_files_admin/:requestId'
        , multer_multi_file_conf
        ,[
          ValidationMiddleware.validJWTNeeded,
          VerifyRequestMiddleware.explodeFormData,
          GoogleDriveMiddleware.validMimeTypes,
          VerifyRequestMiddleware.validRequestObject,
          RequestStateMachineMiddleware.validateTransitionForAdmin,
          GoogleDriveMiddleware.uploadFiles,
          RequestsController.update_files
        ]
    );

    app.get(config.api_version+'/requests_rem_generator/:requests_ids/:payer_account/:payment_date', [
        // ValidationMiddleware.validJWTNeeded,
        RequestsController.generate_rem
    ]);
};
