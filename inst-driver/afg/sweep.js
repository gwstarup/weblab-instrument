'use strict';

var sysConstant = require('../sys/sysConstant.js');
var propMethod  =  require('../dev/propMethod.js');
var util = require('util');
//var debuglog_noisy = util.debuglog('noisy');
var debug  =  require('debug');
var log  =  debug('sweep:log');
var info  =  debug('sweep:info');
var error  =  debug('sweep:error');

function SWEEP(){
    this.temp="";
    this.type = 'LIN';
    this.source = 'INTernal';
    this.startfreq = '1E+3';
    this.stopfreq = '1E+3';
    this.centerfreq = '1E+3';
    this.span = '1E+3';
    this.swptime = '1E-1';
    this.markerfreq = '1E+3';
    this.marker = 'OFF';
    this.state =  'OFF';
}

SWEEP.prototype.cmdHandler = {

    "SweepState":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.state = arg;
                  },
        getHandler : function(sweepObj, res, cb){
                        res = res.slice(0, -1);
                        sweepObj.state = res.toString();
                        return true;
                  }
    },
    "SweepFrqStart":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.startfreq = arg;
                  },
        getHandler : function(sweepObj, res, cb){

                        res = res.slice(0, -1);
                        sweepObj.startfreq = res.toString();
                        return true;
                  }
    },
    "SweepFrqStop":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.stopfreq = arg;
                  },
        getHandler : function(sweepObj, res, cb){
                        res = res.slice(0, -1);
                        sweepObj.stopfreq = res.toString();
                        return true;
                  }
    },
    "SweepFrqCenter":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.centerfreq = arg;
                  },
        getHandler : function(sweepObj, res, cb){
                        res = res.slice(0, -1);
                        sweepObj.centerfreq = res.toString();
                        return true;
                  }
    },
    "SweepFrqSpan":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.span = arg;
                  },
        getHandler : function(sweepObj, res, cb){
                        res = res.slice(0, -1);
                        sweepObj.span = res.toString();
                        return true;
                  }
    },
    "SweepSpacing":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.type = arg;
                  },
        getHandler : function(sweepObj, res, cb){
                        res = res.slice(0, -1);
                        sweepObj.type = res.toString();
                        return true;
                  }
    },
    "SweepTime":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.swptime = arg;
                  },
        getHandler : function(sweepObj, res, cb){
                        res = res.slice(0, -1);
                        sweepObj.swptime = res.toString();
                        return true;
                  }
    },
    "SweepSource":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.source = arg;
                  },
        getHandler : function(sweepObj, res, cb){
                        res = res.slice(0, -1);
                        sweepObj.source = res.toString();
                        return true;
                  }
    },
    "SweepMarker":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.marker = arg;
                  },
        getHandler : function(sweepObj, res, cb){
                        res = res.slice(0, -1);
                        sweepObj.marker = res.toString();
                        return true;
                  }
    },
    "SweepMarkerFreq":{
        setHelper : function(sweepObj, arg, cb){
                        sweepObj.markerfreq = arg;
                  },
        getHandler : function(sweepObj, res, cb){
                        res = res.slice(0, -1);
                        sweepObj.markerfreq = res.toString();
                        return true;
                  }
    }
};

exports.initSweepObj = function(id) {

    var sweepCmd = new SWEEP();

    sweepCmd.id = id;
    sweepCmd.prop = propMethod.CreatMethod.call(this, id);
    // log('meas id='+id);
    // log('meas this='+this);
    return sweepCmd;

}
