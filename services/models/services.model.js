const config      = require('../../common/config/env.config.js');
const mongoose    = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.MONGODB_URI || config.mongodb_uri || 'mongodb://localhost/inkiri');

const AutoIncrement = require('mongoose-sequence')(mongoose);
// const AutoIncrementFactory = require('mongoose-sequence');

const Schema = mongoose.Schema;

exports.ENUM_STATE_INITIATED = 'enum_state_initiated';
exports.ENUM_STATE_PUBLISHED = 'enum_state_published';
exports.ENUM_STATE_INACTIVE  = 'enum_state_inactive';
exports.ENUM_STATE_ERROR     = 'enum_state_error';

exports.services_states = [
  {
    key   : exports.ENUM_STATE_INITIATED,
    title : 'Initialized',
  },
  {
    key   : exports.ENUM_STATE_PUBLISHED,
    title : 'Published',
  },
  {
    key   : exports.ENUM_STATE_INACTIVE,
    title : 'Inactive'
  },
  {
    key   : exports.ENUM_STATE_ERROR,
    title : 'Error'
  }
];

const serviceSchema = new Schema({
    created_by:       { type: Schema.Types.ObjectId, ref: 'Users', required : true },
    account_name:     { type: String, index: true, required : true },
    serviceCounterId: { type: Number, unique : true },

    title:            { type: String  , unique : true, index: true },
    description:      { type: String  , unique : true, index: true },
    amount:           { type: Number , required: true },
    state:            { type: String, enum:[exports.ENUM_STATE_INITIATED, exports.ENUM_STATE_PUBLISHED, exports.ENUM_STATE_ERROR, exports.ENUM_STATE_INACTIVE] },

    contracts: [
      {
        customer:                { type: Schema.Types.ObjectId, ref: 'Users', required: true },
        customer_account_name:   { type: String, required: true },
        amount:                  { type: Number , required: true },
        from:                    { type: Date , required: true },
        to:                      { type: Date , required: true }
      }],
  },
  { timestamps: { createdAt: 'created_at' } });

serviceSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
serviceSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret, options) {
        delete ret.__v;
        return ret;
    }
});

serviceSchema.findById = function (cb) {
    return this.model('Services').find({id: this.id}, cb);
};

serviceSchema.plugin(AutoIncrement, {inc_field: 'serviceCounterId'});

const Service = mongoose.model('Services', serviceSchema);

// exports.findByAccountName = (account_name) => {
//     return new Promise((resolve, reject) => {
//         Service.find({account_name: account_name})
//             .populate('created_by')
//             // .populate('contracts.customer')
//             .exec(function (err, services) {
//                 if (err) {
//                     reject(err);
//                 } else {
//                   if(!services || services.length==0)
//                     return reject('Service not found!');
//                   const x = services.map(service => service.toJSON() )
//                   resolve(x);
//                 }
//             })
//     });
// };

exports.getById = (id) => {
  return new Promise((resolve, reject) => {
      Service.findById(id)
          .populate('created_by')
          .populate('contracts.customer')
          .exec(function (err, result) {
              if (err) {
                  reject(err);
              } else {
                  if(!result)
                  {
                    reject('NOT FOUND!!!!!!!!!');
                    return;
                  }
                  resolve (result.toJSON());

              }
          })
  });
};

exports.createService = (serviceData) => {
    let service = new Service(serviceData);
    return service.save();
};

exports.list = (perPage, page, query) => {
    return new Promise((resolve, reject) => {
        Service.find(query)
            .populate('created_by')
            .populate('contracts.customer')
            .limit(perPage)
            .skip(perPage * page)
            .exec(function (err, services) {
                if (err) {
                    reject(err);
                } else {
                    const x = services.map(service => service.toJSON() )
                    resolve(x);
                }
            })
    });
};

exports.patchService = (id, serviceData) => {
    return Service.findOneAndUpdate({
        _id: id
      }, serviceData);
};

exports.removeById = (serviceId) => {
    return new Promise((resolve, reject) => {
        Service.remove({_id: serviceId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};
