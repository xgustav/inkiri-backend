const config               = require('../../common/config/env.config.js');
const RequestModel         = require('../models/requests.model');
const crypto               = require('crypto');
const rem_generator        = require('../../rem/rem_generator');
var moment                 = require('moment');
const NotificationHelper   = require('../../notifications/helper/helper');


exports.insert = async (req, res) => {

  req.body.state = RequestModel.STATE_REQUESTED;
  
  RequestModel.createRequest(req.body)
    .then(async (result) => {

        try{ 
          const push_notif = await NotificationHelper.onNewRequest(result, req.jwt.account_name); 
        }catch(e){
        }

        res.status(201).send({id: result._id, requestCounterId: result.requestCounterId});
    }, (err)=>{
        console.log(' request.Controller::ERROR', JSON.stringify(err));
        res.status(400).send({error:err.errmsg});
    });
};

exports.insert_files = async (req, res) => {

  // req.body.state = RequestModel.STATE_REQUESTED;
  // const request = req.body.request;
  // delete req.body.request;
  // console.log(' ABOUT TO PARSE REQUEST:: ', request)
  // req.body = {
  //             ...req.body
  //             , ...JSON.parse(request)
  // };

  RequestModel.createRequest(req.body)
  .then(async (result) => {

      try{ const push_notif = await NotificationHelper.onNewRequest(result, req.jwt.account_name); }catch(e){}

      res.status(201).send({id: result._id, requestCounterId: result.requestCounterId});
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

        // From & To, Provider and Excchanges
        if (req.query.from&&req.query.to) {
            filter = { $or : [{from: req.query.from}, {to: req.query.to}] };
        }
        else
        {
          if (req.query.from) {
              filter = {...filter, from: req.query.from};
          }
          if (req.query.to) {
              filter = {...filter, to: req.query.to};
          }
        }
        if (req.query.provider_id) {
            filter = {...filter, provider: req.query.provider_id};
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
        res.status(404).send({error:JSON.stringify(err)});
      });
    };

exports.getById = async (req, res) => {
    console.log(' >> getById:', req.params.requestId);
    RequestModel.findById(req.params.requestId)
      .then((result) => {
          if(!result)
          {
            res.status(404).send({error:'Request NOT FOUND #1'});
            return;
          }
          res.status(200).send(result);
      },
      (err)=>{
        res.status(404).send({error:JSON.stringify(err)});
      });
  };


exports.getByCounter = async (req, res) => {
  console.log(' >> getById:', req.params.counterId);
  let filter = { requestCounterId : req.params.counterId};
  RequestModel.list(1, 0, filter)
    .then((result) => {
      if(!result || !result[0])
        return res.status(404).send({error:'Request NOT FOUND #2'});
      return res.status(200).send(result[0]);
    },
     (err)=> {
      return res.status(404).send({error:JSON.stringify(err)});
    });

  };

exports.patchById = async (req, res) => {
    // if (req.body.password) {
    //     let salt = crypto.randomBytes(16).toString('base64');
    //     let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
    //     req.body.password = salt + "$" + hash;
    // }
    console.log(' ABOUT TO PATCH REQUEST ', req.params.requestId)
    console.log(JSON.stringify(req.body));

    RequestModel.patchRequest(req.params.requestId, req.body)
        .then(async (result) => {
            
            try{ const push_notif = await NotificationHelper.onUpdateRequest(result, req.jwt.account_name); }catch(e){}
            
            res.status(200).send({});
        });

};

exports.update_files = async (req, res) => {

  // const request = req.body.request;
  // delete req.body.request;
  // console.log(' ABOUT TO PARSE REQUEST:: ', request)
  // req.body = {
  //             ...req.body
  //             , ...JSON.parse(request)
  // };
  console.log(' ABOUT TO PATCH REQUEST WITH FILES ', req.params.requestId)
  console.log(' request body data:', JSON.stringify(req.body));


  RequestModel.patchRequest(req.params.requestId, req.body)
      .then(async(result) => {

          try{ const push_notif = await NotificationHelper.onUpdateRequest(result, req.jwt.account_name); }catch(e){}

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

exports.generate_rem = async (req, res) => {
  const requests_ids  = req.params.requests_ids;
  const payer_account = req.params.payer_account;
  const payment_date  = moment.unix(req.params.payment_date);
  let ret = '';
  try{
    ret = await rem_generator.generateREMForRequests(requests_ids, payer_account, payment_date);
  }catch(e){
    console.log(' **** generate_rem ERROR: ',e)
    res.status(500).send({error:JSON.stringify(e)});    
    return;
  }          
  // console.log(ret);
  // res.statusCode = 200;
  // res.setHeader('Content-Type', 'text/plain');
  res.set('Content-Type', 'text/plain');
  const payers = ['EMPRESA',
                  'INSTITUTO',
                  'INSTITUTO_PPA']
  res.set('Content-Disposition', `attachment; filename=REM.${payers[parseInt(payer_account)]}.${moment().format('YYYY-MM-DD_HH-mm-ss')}.rem`);
  res.status(200).send(ret);
  return;
  // res.status(200).send(ret, { 'Content-Disposition': `attachment; filename=REM.${moment().format('YYYY-MM-DD_HH:mm:ss')}.txt` }); 
};
