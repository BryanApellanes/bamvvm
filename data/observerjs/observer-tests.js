process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled rejection at: Promise ', p, 'reason:', reason);
})

let { expect } = require('chai');
let _ = require('lodash');
let bam = require('../../bam');
let observer = require('./observer');
let testValue = "this is a test value";
let updatedValue = "this is an updated test value";
let testObj = {
        value1: testValue,
        value2: "this is another value"                
    }
let testArray = [_.extend({}, testObj), _.extend({}, testObj), _.extend({}, testObj), _.extend({}, testObj), _.extend({}, testObj) ];

describe("observer", () =>{
    it("returns something", (done) => {
        let observable = observer.observe(testObj);
        
        expect(observable).to.not.equal(null, "observable was null");
        done();
    })
    it("returns an observable", (done) => {
        let observable = observer.observe(testObj),
            changeFired = false;

        observable.change("value1", (val) => {
            console.log(JSON.stringify(val));
            changeFired = true;
        })
        expect(_.isFunction(observable.value1)).to.equal(true, "value1 wasn't a function as expected");        
        observable.value1("my new test value");
        expect(changeFired).to.equal(true);
        done();
    })
    it("can observe an array", (done) => {
        let observable = observer.observe(testArray),
            changeAtFired = false;
            changeFired = false;
        
        observable.change("value1", (val) => {
            console.log("value1 was changed");
            JSON.stringify(val);
            changeFired = true;
        })
        observable.changeAt(4, 'value2', (val) => {
            console.log('value2 of the last element was changed');
            JSON.stringify(val);
            changeAtFired = true;
        })
        let obj = observable[0];
        obj.value1("my new value");
        let last = observable[4];
        last.value2("my new value2");

        expect(changeFired).to.equal(true, "change didn't fire");
        expect(changeAtFired).to.equal(true, "changeAt didn't fire");
        done();
    })
    it("can be read", (done) => {
        let observable = observer.observe(testObj);

        let val = observable.value1();
        expect(val).to.equal(testValue);
        observable.value1(updatedValue);
        val = observable.value1();
        expect(val).to.equal(updatedValue);

        let raw = observable.toData();
        expect(raw.value1).to.equal(updatedValue);
        done();
    })
})