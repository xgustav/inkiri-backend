const { JsonRpc } = require("@eoscafe/hyperion")
// const fetch    = require("isomorphic-fetch")
const fetch                                    = require('node-fetch');
// const { TextEncoder, TextDecoder }             = require('util');
const config      = require('../../common/config/env.config.js');
const endpoint    = config.eos.hyperion.history_endpoint;
const rpc         = new JsonRpc(endpoint, { fetch })

var moment        = require('moment');

const contract    = config.eos.token.contract;
const account     = config.eos.token.account;


const actionsToTx = (actions) => {
  // sort actions
  const sorted_actions = actions.sort(function(a,b){ 
    if(a.global_sequence>b.global_sequence) return 1;
    if(b.global_sequence>a.global_sequence) return -1;
    return 1;
  });
  const main_action = sorted_actions[0];
  const from_account_name = main_action.act.data.from||null;
  const to_account_name   = main_action.act.data.to||null;
  const amount            = main_action.act.data.quantity ? 
    exports.quantityToNumber(main_action.act.data.quantity) 
    :(main_action.act.data.amount
        ? exports.quantityToNumber(main_action.act.data.amount) 
        : (main_action.act.data.price
          ? exports.quantityToNumber(main_action.act.data.price) 
          : 0.0));
  
  return{
      tx_id:                  main_action.trx_id,
      block_num:              main_action.block_num,
      block_id:               main_action.global_sequence,
      block_timestamp:        main_action['@timestamp'],
      trace: {
        id:                   main_action.trx_id,
        topLevelActions:      sorted_actions.map(action=>{
          return {
            account:          action.act.account,
            name:             action.act.name,
            authorization:    action.act.authorization,
            data:             action.act.data
          };
        })
      },
      from_account_name : from_account_name,
      to_account_name   : to_account_name,
      amount            : amount
    };
}

exports.queryTransactions = async (config, _contract, cursor, last_block_or_timestamp) => new Promise(async(res,rej)=> {
  
  try {
    const options = {
      filter: `${account}:*`,
      skip: 0,
      limit: 100,
      sort: 'asc',
      after: last_block_or_timestamp 
        ? moment(last_block_or_timestamp).toISOString() 
        : moment().subtract(1, 'hours').toISOString()
    };
    
    const response = await rpc.get_actions(contract, options);
    // console.log('========================== RAW');
    // console.log(JSON.stringify(response));
    const results = response.actions || []
    
    const groupActions = (_txs) => {
      let tmp          = {};
      let transactions = [];
      
      for(var i=0; i<_txs.length;i++){
        const tx = _txs[i];
        if(!tmp[tx.trx_id])
        {
          // Si tmp es un objeto, lo appendeo a la lista de return.
          if(Object.keys(tmp).length>0)
          {
            const transaction = actionsToTx(Object.values(tmp)[0]);
            transactions.push(transaction);
            tmp = {};
          }
          tmp[tx.trx_id] = [tx];
        }
        else
        {
          tmp[tx.trx_id].push(tx);
        }

        if((i+1)==_txs.length && Object.keys(tmp).length>0)
        {
          const transaction = actionsToTx(Object.values(tmp)[0]);
          transactions.push(transaction);
        }
      }
      return transactions;
    }
    const txs = groupActions(results);
    res ({txs:txs, cursor:null})
    
  } catch (error) {
    rej(error);
    console.log("An error occurred", error)
  }

});

// exports.getAccountBalance = async (account_name) => {
//   const response = await rpc.get_currency_balance(config.eos.token.contract, account_name, config.eos.token.code)
//   return response[0];

//   // const client = exports.createClient(config.api_key, config.network);
//   // const response = await client.stateTablesForScopes(contract, scope, table);
//   // client.release()
//   // return response;
  
//   // const response = await rpc.get_table_rows({
//   //   json:           true
//   //   , code:         config.eos.bank.account
//   //   , scope:        config.eos.bank.account
//   //   , table:        config.eos.bank.table_balances
//   //   , lower_bound:  '11111111111a'
//   //   , upper_bound:  'zzzzzzzzzzzz'
//   //   , limit:        500
//   //   , reverse:      false
//   //   , show_payer :  false
//   // });
//   // return response.rows;

// }

exports.quantityToNumber = (value) => {
    if(!value)
      value=0;
    if(isNaN(value))
      value = Number(value.split(' ')[0]); //replace(currency.eos_symbol, '')
    return parseFloat(value);
};