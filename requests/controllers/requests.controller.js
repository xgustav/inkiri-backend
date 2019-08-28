const config = require('../../common/config/env.config.js');
const RequestModel = require('../models/requests.model');
const crypto = require('crypto');

exports.insert = (req, res) => {
  
  req.body.state = RequestModel.STATE_REQUESTED;
  // res.status(201).send({'res':'exports.insert', received: req.body});
  console.log(' request.Controller::ABOUT TO SAVE')
  RequestModel.createRequest(req.body)
  .then((result) => {
      res.status(201).send({id: result._id});
  }, (err)=>{
      console.log(' request.Controller::ERROR', JSON.stringify(err));
      res.status(400).send({error:err.errmsg});            
  });
};

exports.list = (req, res) => {
    let limit = req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
    let page = 0;
    let filter = {};
    if (req.query) {
        if (req.query.page) {
            req.query.page = parseInt(req.query.page);
            page = Number.isInteger(req.query.page) ? req.query.page : 0;
        }
        if (req.query.from) {
            filter = {...filter, from: req.query.from};
        }
        if (req.query.to) {
            filter = {...filter, to: req.query.to};
        }
        if (req.query.state) {
            filter = {...filter, state: req.query.state};
        }
        if (req.query.requested_type && !req.query.requested_type.includes('|')) {
            filter = {...filter, requested_type: req.query.requested_type};
        }
        else
          if (req.query.requested_type && req.query.requested_type.includes('|')) {
            filter = {...filter,  $or : req.query.requested_type.split('|').map(req_item=> {return { requested_type: req_item}}) };
          }
    }
    // console.log(req.query.requested_type.split('|').map(req_item=> {return { requested_type: req_item}}))
    // console.log(filter)
    // db.requests.find({requested_type:{$or:['type_deposit']}})
    // db.requests.find( { $or: [ { requested_type: "type_deposit" }, { requested_type: "type_withdraw" } ] } )
    // query.or([{ color: 'red' }, { status: 'emergency' }])
            
    RequestModel
    .list(limit, page, filter)
    .then((result) => {
        res.status(200).send(result);
    },
     (err)=> {

    });
};

exports.getById = (req, res) => {
    RequestModel.findById(req.params.userId)
        .then((result) => {
            res.status(200).send(result);
        });
};

exports.patchById = (req, res) => {
    // if (req.body.password) {
    //     let salt = crypto.randomBytes(16).toString('base64');
    //     let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
    //     req.body.password = salt + "$" + hash;
    // }

    RequestModel.patchRequest(req.params.requestId, req.body)
        .then((result) => {
            // res.status(204).send({});
            res.status(200).send({});
        });

};

exports.removeById = (req, res) => {
    RequestModel.removeById(req.params.requestId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};