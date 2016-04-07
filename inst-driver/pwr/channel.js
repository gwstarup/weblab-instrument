'use strict';

var sysConstant = require('../sys/sysConstant.js');
var propMethod  =  require('../dev/propMethod.js');
var util = require('util');
//var debuglog_noisy = util.debuglog('noisy');
var debug  =  require('debug');
var log  =  debug('pwr_channel:log');
var info  =  debug('pwr_channel:info');
var error  =  debug('pwr_channel:error');

function Channel(){
    this.iout = '0';
    this.vout = '0';
    this.iset = '0';
    this.vset = '0';
}

Channel.prototype.cmdHandler = {
    'ISET' : {
                setHelper : function(chObj, arg, cb){
                                chObj.iset = arg;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.iset = res.toString();
                                return true;
                          }
    },
    'VSET' : {
                setHelper : function(chObj, arg, cb){
                                chObj.vset = arg;
                                return true;
                          },
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.vset = res.toString();
                                return true;
                          }
    },
    'IOUT' : {
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.iout = res.toString();
                                return true;
                          }
    },
    'VOUT' : {
                getHandler : function(chObj, res, cb){
                                res = res.slice(0, -1);
                                chObj.vout = res.toString();
                                return true;
                          }
    }
};

exports.initPwrChanObj = function(id) {

    var chanCmd = new Channel();

    chanCmd.id = id;
    chanCmd.prop = propMethod.CreatMethod.call(this, id);
    // log('meas id='+id);
    // log('meas this='+this);
    return chanCmd;

}
