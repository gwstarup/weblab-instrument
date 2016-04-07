'use strict';

var sysConstant = require('../sys/sysConstant.js');
var propMethod  =  require('../dev/propMethod.js');
var util = require('util');
//var debuglog_noisy = util.debuglog('noisy');
var debug  =  require('debug');
var log  =  debug('am_channel:log');
var info  =  debug('am_channel:info');
var error  =  debug('am_channel:error');

function AM(){
    this.temp="";
    this.type = 'SIN';
    this.source = 'INTernal';
    this.freq = '1E+6';
    this.state =  'OFF';
    this.depth = '1E+1';
}

AM.prototype.cmdHandler = {
    'AMInteFunc' : {
                setHelper : function(amObj, arg, cb){
                                amObj.type = arg;
                          },
                getHandler : function(amObj, res, cb){
                                res = res.slice(0, -1);
                                amObj.type = res.toString();
                                return true;
                          }
    },
    'AMInteFreq' : {
                setHelper : function(amObj, arg, cb){
                                amObj.freq = arg;
                                return true;
                          },
                getHandler : function(amObj, res, cb){
                                res = res.slice(0, -1);
                                amObj.freq = res.toString();

                                return true;
                          }
    },
    'AMSource' : {
                setHelper : function(amObj, arg, cb){
                                amObj.source = arg;
                          },
                getHandler : function(amObj, res, cb){
                                res = res.slice(0, -1);
                                amObj.source = res.toString();
                                return true;
                          }
    },
    'AMState' : {
                setHelper : function(amObj, arg, cb){
                                amObj.state = arg;
                          },
                getHandler : function(amObj, res, cb){
                                res = res.slice(0, -1);
                                amObj.state = res.toString();
                                return true;
                          }
    },
    'AMDepth' : {
                setHelper : function(amObj, arg, cb){
                                amObj.depth = arg;
                                return true;
                          },
                getHandler : function(amObj, res, cb){
                                res = res.slice(0, -1);
                                amObj.depth = res.toString();
                                return true;
                          }
    }

};

exports.initAMObj = function(id) {

    var amCmd = new AM();

    amCmd.id = id;
    amCmd.prop = propMethod.CreatMethod.call(this, id);
    // log('meas id='+id);
    // log('meas this='+this);
    return amCmd;

}
