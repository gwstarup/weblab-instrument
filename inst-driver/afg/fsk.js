'use strict';

var sysConstant = require('../sys/sysConstant.js');
var propMethod  =  require('../dev/propMethod.js');
var util = require('util');
//var debuglog_noisy = util.debuglog('noisy');
var debug  =  require('debug');
var log  =  debug('fsk_channel:log');
var info  =  debug('fsk_channel:info');
var error  =  debug('fsk_channel:error');

function FSK(){
    this.temp="";
    this.source = 'INTernal';
    this.freq = '1E+3';
    this.state =  'OFF';
    this.rate = '1E+1';
}

FSK.prototype.cmdHandler = {
    'FSKInteFreq' : {
                setHelper : function(fskObj, arg, cb){
                                fskObj.freq = arg;
                                console.log(fskObj.temp);
                                console.log(arg);
                                console.log('AMInteFreq setHandler');
                                return true;
                          },
                getHandler : function(fskObj, res, cb){
                                res = res.slice(0, -1);
                                fskObj.freq = res.toString();

                                return true;
                          }
    },
    'FSKSource' : {
                setHelper : function(fskObj, arg, cb){
                                fskObj.source = arg;
                          },
                getHandler : function(fskObj, res, cb){
                                res = res.slice(0, -1);
                                fskObj.source = res.toString();
                                return true;
                          }
    },
    'FSKState' : {
                setHelper : function(fskObj, arg, cb){
                                fskObj.state = arg;
                          },
                getHandler : function(fskObj, res, cb){
                                res = res.slice(0, -1);
                                fskObj.state = res.toString();
                                return true;
                          }
    },
    'FSKRate' : {
                setHelper : function(fskObj, arg, cb){
                                fskObj.rate = arg;
                                return true;
                          },
                getHandler : function(fskObj, res, cb){
                                res = res.slice(0, -1);
                                fskObj.rate = res.toString();
                                return true;
                          }
    }

};

exports.initFSKObj = function(id) {

    var fskCmd = new FSK();

    fskCmd.id = id;
    fskCmd.prop = propMethod.CreatMethod.call(this, id);
    // log('meas id='+id);
    // log('meas this='+this);
    return fskCmd;

}
