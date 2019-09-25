const config = require('../../common/config/env.config.js');
const ProviderModel = require('../models/providers.model');
const crypto = require('crypto');


exports.ping = (req, res) => {
    res.status(200).send({ping:'pong'});
}
exports.insert = (req, res) => {
    ProviderModel.createProvider(req.body)
        .then((result) => {
            res.status(201).send({id: result._id});
        }, (err)=>{
            console.log(' ERROR# 1', JSON.stringify(err))
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
        if (req.query.email) {
            filter = {...filter, email: req.query.email};
        }
        if (req.query.name) {
            filter = {...filter, name: new RegExp('^'+name+'$', "i")};
        }
    }
    ProviderModel.list(limit, page, filter)
        .then((result) => {
            res.status(200).send(result);
        })
};

exports.getById = (req, res) => {
    ProviderModel.findById(req.params.providerId)
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

    ProviderModel.patchProvider(req.params.providerId, req.body)
        .then((result) => {
            // res.status(204).send({});
            res.status(200).send({});
        });

};

exports.removeById = (req, res) => {
    ProviderModel.removeById(req.params.providerId)
        .then((result)=>{
            // res.status(204).send({});
            res.status(200).send({});
        });
};