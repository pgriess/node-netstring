// Verify that the 'length' method functions as expected

var at = require('./async_testing');
var Buffer = require('buffer').Buffer;
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
            as.equal(ns.nsPayload('3:abc,'), 'abc');
            as.equal(ns.nsPayload(new Buffer('3:abc,')), 'abc');
        },
        'incomplete' : function(as) {
            as.equal(ns.nsPayload(''), -1);
            as.equal(ns.nsPayload('3'), -1);
            as.equal(ns.nsPayload('3:ab'), -1);
            as.equal(ns.nsPayload('3:abc'), -1);
        },
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
            as.equal(ns.nsWrite('abc'), '3:abc,');
            as.equal(ns.nsWrite('a'), '1:a,');
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
        }
    });

    ts.runTests();
})();
