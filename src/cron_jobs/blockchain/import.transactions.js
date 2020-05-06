const importer       = require('../../transactions/services/importer');
const processor      = require('../../transactions/services/processor');

const config         = require('../../common/config/env.config.js');

const _do = async () => {
  // Import transactions
  console.log (' ====== Import transactions')
  const y = await importer.import();
  console.log (' == Transactions imported!!')

  
  // Process imported transactions
  console.log (' ====== Process transactions')
  const z = await processor.process();
  console.log (' == Transactions processed!!')
  console.log('END o_O');

} 

const tick  = 30000;
// const loops = 10 * 60 * 1000 / tick; 
const loops = config.environment == 'prod'
    ? 2
    : 10 * 60 * 1000 / tick;
     
(async () => {
  
  let i = 0;
  let x = await _do();
  const interval_id = setInterval(
    async() => {
    i++;
    if (i < loops) {
      x = await _do();
    }
    else{
      clearInterval(interval_id );
      return process.exit(0);
    }
  }, tick);  
  
  
})();

