'use strict';

var sysConstant = require('../sys/sysConstant.js');
var propMethod  =  require('../dev/propMethod.js');
var util = require('util');
//var debuglog_noisy = util.debuglog('noisy');
var debug  =  require('debug');
var log  =  debug('pm_channel:log');
var info  =  debug('pm_channel:info');
var error  =  debug('pm_channel:error');

function PM(){
    this.temp="";
    this.type = 'SIN';
    this.source = 'INTernal';
    this.freq = '1E+3';
    this.state =  'OFF';
    this.deviation = '1E+1';
}

PM.prototype.cmdHandler = {
    'PMInteFunc' : {
                setHelper : function(pmObj, arg, cb){
                                pmObj.type = arg;
                          },
                getHandler : function(pmObj, res, cb){
                                console.log(res);
                                res = res.slice(0, -1);
                                pmObj.type = res.toString();
                                return true;
                          }
    },
    'PMInteFreq' : {
                setHelper : function(pmObj, arg, cb){
                                pmObj.freq = arg;
                                return true;
                          },
                getHandler : function(pmObj, res, cb){
                                res = res.slice(0, -1);
                                pmObj.freq = res.toString();

                                return true;
                          }
    },
    'PMSource' : {
                setHelper : function(pmObj, arg, cb){
                                pmObj.source = arg;
                          },
                getHandler : function(pmObj, res, cb){
                                res = res.slice(0, -1);
                                pmObj.source = res.toString();
                                return true;
                          }
    },
    'PMState' : {
                setHelper : function(pmObj, arg, cb){
                                pmObj.state = arg;
                          },
                getHandler : function(pmObj, res, cb){
                                res = res.slice(0, -1);
                                pmObj.state = res.toString();
                                return true;
                          }
    },
    'PMDeviation' : {
                setHelper : function(pmObj, arg, cb){
                                pmObj.deviation = arg;
                                return true;
                          },
                getHandler : function(pmObj, res, cb){
                                res = res.slice(0, -1);
                                pmObj.deviation = res.toString();
                                return true;
                          }
    }

};

exports.initPMObj = function(id) {

    var pmCmd = new PM();

    pmCmd.id = id;
    pmCmd.prop = propMethod.CreatMethod.call(this, id);
    // log('meas id='+id);
    // log('meas this='+this);
    return pmCmd;

}
