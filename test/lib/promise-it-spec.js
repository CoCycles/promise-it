/**
 * Require testing dependencies
 */
var rewire = require('rewire'),
    promiseIt = rewire('../../lib/promise-it'),
    chai = require('chai'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    expect = chai.expect;

chai.use(sinonChai);

describe('promiseIt', function() {

    /**
     * mock function for testing purposes
     */
    function someFunction() {
        testVal = this.console;
    }

    /**
     * functions that calls a callback
     * @param callback
     */
    function callbackFunc(callback) {
        callback('firstArg', 'secondArg');
    }

    /**
     * Mock for the q dependency
     */
    var qMock,
        promiseMock = {},
        resolveMock,
        testVal = null,
        someObject = { console: 'boo', bar: 1, contextFunc: someFunction };

    /**
     * Recreate qMock and monkey patch it to promiseIt before each test
     */
    beforeEach(function() {
        resolveMock = sinon.stub();

        qMock = {
            defer: sinon.stub().returns({
                resolve: resolveMock,
                promise: promiseMock
            }),
            allSettled: sinon.stub().returns(promiseMock)
        };

        promiseMock = {};
        testVal = null;
        someObject.spyFunc = sinon.stub();

        promiseIt.__set__('q', qMock);
    });

    describe('#promiseIt()', function() {

        it('should call provided function with given parameters', function() {
            var func = someObject.spyFunc;
            promiseIt(func, ['firstArg', 'secondArg']);

            expect(func).have.been.calledWith('firstArg', 'secondArg');
        });

        it('should call provided function in given context', function() {
            var func  = someObject.contextFunc;
            promiseIt(func, 'some string', someObject);

            expect(testVal).to.equal(someObject.console);
        });

        it('should create a new defer', function() {
            promiseIt(someObject.spyFunc);

            expect(qMock.defer).have.been.calledOnce;
        });

        it('should return a promise from the created defer', function() {
            var promise = promiseIt(someObject.spyFunc);

            expect(promise).to.deep.equal(promiseMock);
        });

        it('should use the global context if specific context was not passed', function() {
            promiseIt(someObject.contextFunc);

            expect(testVal).to.deep.equal(console);
        });

        it('should resolve the promise with all arguments', function() {
            promiseIt(callbackFunc);

            expect(resolveMock).have.been.calledWith(['firstArg', 'secondArg']);
        });
    });

    describe('#promiseIt.all()', function() {

        function generateFunctionArray() {
            var i = 0,
                funcs = [];

            for(i; i < 5; i++) {
                funcs.push({
                    func: someObject.spyFunc,
                    params: ['one', 'two']
                });
            }

            return funcs;
        }

        it('should throw an error if given arg was not an array', function() {
            expect(function() {
                promiseIt.all('');
            }).to.throw(Error);
        });

        it('should call q.allSettled with array of all given functions as promises', function() {
            promiseIt.all(generateFunctionArray());

            expect(qMock.allSettled).have.been.calledWith([promiseMock, promiseMock, promiseMock, promiseMock, promiseMock]);
        });

        it('should return one promise as result of calling q.allSettled and returning it', function() {
            expect(promiseIt.all(generateFunctionArray())).to.deep.equal(promiseMock);
        });
    });

});