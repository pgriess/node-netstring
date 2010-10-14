// Verify that the 'length' method functions as expected

var at = require('./async_testing');
var Buffer = require('buffer').Buffer;
var events = require('events');
var ns = require('../lib/ns');

(function() {
    var ex = function(as, buf, msg) {
        try {
            ns.nsPayloadLength(buf);
        } catch (e) {
            as.equal(e.message, msg);
        }
    };

    var ts = new at.TestSuite('nsPayloadLength');

    ts.addTests({
        'simple' : function(as) {
            as.equal(ns.nsPayloadLength('30:'), 30);
        },
        'incomplete' : function(as) {
            as.equal(ns.nsPayloadLength(''), -1);
            as.equal(ns.nsPayloadLength('30'), -1);
        },
        'leading zero' : function(as) {
            as.equal(ns.nsPayloadLength('0:,'), 0);
            ex(as, '03:', 'Invalid netstring with leading 0');
            ex(as, '00:', 'Invalid netstring with leading 0');
        },
        'leading colon' : function(as) {
            ex(as, ':', 'Invalid netstring with leading \':\'');
            ex(as, ':a', 'Invalid netstring with leading \':\'');
        },
        'invalid char' : function(as) {
            ex(as, '3;', 'Unexpected character \';\' found at offset 1');
            ex(as, ';', 'Unexpected character \';\' found at offset 0');
        },
        'offset' : function(as) {
            as.equal(ns.nsPayloadLength('xxx30', 3), -1);
            as.equal(ns.nsPayloadLength('xxx30:', 3), 30);
        },
        'encoding' : function(as) {
            as.equal(ns.nsPayloadLength('30:', 0, 'utf8'), 30);
            as.equal(ns.nsPayloadLength(new Buffer('30:', 'utf8'), 0), 30);
            as.equal(ns.nsPayloadLength(new Buffer([0x33, 0x30, 0x3a, 0x0], 'binary'), 0), 30);
        }
    });

    ts.runTests();
})();

(function() {
    var ts = new at.TestSuite('nsLength');

    ts.addTests({
        'simple' : function(as) {
            as.equal(ns.nsLength('0:,'), 3);
            as.equal(ns.nsLength('1:q,'), 4);
            as.equal(ns.nsLength('30:'), 34);
        },
        'incomplete' : function(as) {
            as.equal(ns.nsLength(''), -1);
            as.equal(ns.nsLength('30'), -1);
        },
        'encoding' : function(as) {
            as.equal(ns.nsLength('1:q,', 0, 'utf8'), 4);
            as.equal(ns.nsLength(new Buffer('1:q,', 0, 'utf8')), 4);
            as.equal(ns.nsLength(new Buffer([0x33, 0x30, 0x3a, 0x0], 'binary'), 0), 34);
        }
    });

    ts.runTests();
})();

(function() {
    var ts = new at.TestSuite('nsWriteLength');

    ts.addTests({
        'simple' : function(as) {
            as.equal(ns.nsWriteLength(0), 3);
            as.equal(ns.nsWriteLength(1), 4);
            as.equal(ns.nsWriteLength(9), 12);
            as.equal(ns.nsWriteLength(10), 14);
        }
    });

    ts.runTests();
})();

(function() {
    var ts = new at.TestSuite('nsPayload');

    ts.addTests({
        'simple' : function(as) {
            as.equal(ns.nsPayload('0:,'), '');
            as.equal(ns.nsPayload('3:abc,'), 'abc');
            as.equal(ns.nsPayload(new Buffer('3:abc,')), 'abc');
        },
        'incomplete' : function(as) {
            as.equal(ns.nsPayload(''), -1);
            as.equal(ns.nsPayload('3'), -1);
            as.equal(ns.nsPayload('3:ab'), -1);
            as.equal(ns.nsPayload('3:abc'), -1);
        },
        'utf8' : function(as) {
            as.equal(ns.nsPayload('3:☃,'), '☃');
            as.equal(ns.nsPayload(new Buffer('3:☃,')), '☃');
        },
        'encoding' : function(as) {
            as.equal(ns.nsPayload('3:☃,', 0, 'utf8'), '☃');
            as.equal(ns.nsPayload(new Buffer('3:☃,', 'utf8'), 0), '☃');
            as.equal(ns.nsPayload(new Buffer([0x33, 0x3a, 0x61, 0x62, 0x63, 0x2c], 'binary'), 0), 'abc');
         }
    });

    ts.runTests();
})();

(function() {
    var ex = function(as, msg) {
        try {
            var args = [];
            for (var i = 2; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            ns.nsWrite.apply(this, args);
        } catch (e) {
            as.equal(e.message, msg);
        }
    };

    var beq = function(as, pay, payStart, payEnd, bufLen, bufOff) {
        var buf = new Buffer(ns.nsWriteLength(bufLen));
        var nsLen = ns.nsWrite.call(this, pay, payStart, payEnd, buf, bufOff)
        as.ok(nsLen >= 3);

        var bb = buf.slice(bufOff, bufOff + nsLen);
        as.equal(
            bb.toString(),
            ns.nsWrite(pay, payStart, payEnd)
        );
    };

    var ts = new at.TestSuite('nsWrite');

    ts.addTests({
        'simple' : function(as) {
            as.equal(ns.nsWrite(''), '0:,');
            as.equal(ns.nsWrite('abc'), '3:abc,');
            as.equal(ns.nsWrite('a'), '1:a,');
        },
        'utf8' : function(as) {
          as.equal(ns.nsWrite('☃'), '3:☃,');
          as.equal(ns.nsWrite(new Buffer('☃')), '3:☃,');
        },
        'start' : function(as) {
            as.equal(ns.nsWrite('abc', 1), '2:bc,');
            as.equal(ns.nsWrite('abc', 0), '3:abc,');
            ex(as, 'payStart is out of bounds', 'abc', -1);
            ex(as, 'payStart is out of bounds', 'abc', 3);
        },
        'end' : function(as) {
            as.equal(ns.nsWrite('abc', 0, 1), '1:a,');
            as.equal(ns.nsWrite('abc', 0, 3), '3:abc,');
            as.equal(ns.nsWrite('abc', 0, 0), '0:,');
            ex(as, 'payEnd is out of bounds', 'abc', 0, -1);
            ex(as, 'payEnd is out of bounds', 'abc', 0, 4);
        },
        'bufPay' : function(as) {
            as.equal(ns.nsWrite(new Buffer('abc')), '3:abc,');
            as.equal(ns.nsWrite(new Buffer('abc'), 1), '2:bc,');
            as.equal(ns.nsWrite(new Buffer('abc'), 1, 2), '1:b,');
        },
        'bufTarget' : function(as) {
            beq(as, 'abc', 0, 3, 3, 0);
            beq(as, 'abc', 0, 1, 3, 0);
            beq(as, 'abc', 0, 3, 10, 1);
        },
        'encoding' : function(as) {
            as.equal(ns.nsWrite('☃', 0, 3, null, 0, 'utf8'), '3:☃,');
            as.equal(ns.nsWrite(new Buffer('☃', 'utf8'), 0, 3, null, 0), '3:☃,');
            as.equal(ns.nsWrite(new Buffer([0x61, 0x62, 0x63], 'binary'), 0), '3:abc,');
        }
    });

    ts.runTests();
})();

(function() {
    var ts = new at.TestSuite('Stream');

    ts.addTests({
        'simple' : function(as) {
            var is  = new events.EventEmitter();
            var ins = new ns.Stream(is);

            var MSGS = [
                "abc",
                "hello world!",
                "café",
                "a",
                "b",
                "c"
            ];

            var msgsReceived = 0;
            ins.addListener('data', function(d) {
                as.equal('object', typeof d);
                as.equal(d.toString(), MSGS[msgsReceived]);
                msgsReceived++;
            });

            is.emit('data', new Buffer("3:abc,"));
            is.emit('data', new Buffer("12:hello"));
            is.emit('data', new Buffer(" world!,"));
            is.emit('data', new Buffer("5:café,"));
            is.emit('data', new Buffer("1:a,1:b,1:c,"));
        },
        'set encoding' : function(as) {
            var is  = new events.EventEmitter();
            var ins = new ns.Stream(is);
            ins.setEncoding('utf8');

            var MSGS = [
                "a",
                "b",
                "c"
            ];

            var msgsReceived = 0;
            ins.addListener('data', function(d) {
                as.equal('string', typeof d);
                as.equal(d, MSGS[msgsReceived]);
                msgsReceived++;
            });

            is.emit('data', new Buffer("1:a,1:b,"));
            is.emit('data', new Buffer("1:c,"));
        }
    });

    ts.runTests();
})();
