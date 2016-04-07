'use strict';

var sysConstant = require('../sys/sysConstant.js');
var propMethod  =  require('../dev/propMethod.js');
var util = require('util');
//var debuglog_noisy = util.debuglog('noisy');
var debug  =  require('debug');
var log  =  debug('fm_channel:log');
var info  =  debug('fm_channel:info');
var error  =  debug('fm_channel:error');

function FM(){
    this.temp="";
    this.type = 'SIN';
    this.source = 'INTernal';
    this.freq = '1E+6';
    this.state =  'OFF';
    this.deviation = '1E+1';
}

FM.prototype.cmdHandler = {
    'FMInteFunc' : {
                setHelper : function(fmObj, arg, cb){
                                fmObj.type = arg;
                          },
                getHandler : function(fmObj, res, cb){
                                res = res.slice(0, -1);
                                fmObj.type = res.toString();
                                return true;
                          }
    },
    'FMInteFreq' : {
                setHelper : function(fmObj, arg, cb){
                                fmObj.freq = arg;
                                return true;
                          },
                getHandler : function(fmObj, res, cb){
                                res = res.slice(0, -1);
                                fmObj.freq = res.toString();

                                return true;
                          }
    },
    'FMSource' : {
                setHelper : function(fmObj, arg, cb){
                                fmObj.source = arg;
                          },
                getHandler : function(fmObj, res, cb){
                                res = res.slice(0, -1);
                                fmObj.source = res.toString();
                                return true;
                          }
    },
    'FMState' : {
                setHelper : function(fmObj, arg, cb){
                                fmObj.state = arg;
                          },
                getHandler : function(fmObj, res, cb){
                                res = res.slice(0, -1);
                                fmObj.state = res.toString();
                                return true;
                          }
    },
    'FMDeviation' : {
                setHelper : function(fmObj, arg, cb){
                                fmObj.deviation = arg;
                                return true;
                          },
                getHandler : function(fmObj, res, cb){
                                res = res.slice(0, -1);
                                fmObj.deviation = res.toString();
                                return true;
                          }
    }

};

exports.initFMObj = function(id) {

    var fmCmd = new FM();

    fmCmd.id = id;
    fmCmd.prop = propMethod.CreatMethod.call(this, id);
    // log('meas id='+id);
    // log('meas this='+this);
    return fmCmd;

}
